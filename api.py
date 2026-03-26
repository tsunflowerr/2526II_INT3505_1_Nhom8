from datetime import date, datetime, timedelta

from flask import Flask, jsonify, request
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

try:
    from .domain.entities import CopyStatus, MemberStatus, ReservationStatus
    from .main import DB_PATH, SessionLocal, initialize_database, seed_database
    from .models import (
        Author,
        Book,
        BookCopy,
        Category,
        Loan,
        Member,
        Publisher,
        Reservation,
    )
except ImportError:
    from domain.entities import CopyStatus, MemberStatus, ReservationStatus
    from main import DB_PATH, SessionLocal, initialize_database, seed_database
    from models import (
        Author,
        Book,
        BookCopy,
        Category,
        Loan,
        Member,
        Publisher,
        Reservation,
    )


def error_response(message, status_code):
    return jsonify({"error": message}), status_code


def parse_pagination(default_limit=10, max_limit=100):
    try:
        limit = int(request.args.get("limit", default_limit))
        offset = int(request.args.get("offset", 0))
    except (TypeError, ValueError):
        return None, None, error_response("Invalid pagination parameters", 400)

    if limit < 1 or offset < 0:
        return None, None, error_response("limit must be >= 1 and offset must be >= 0", 400)

    return min(limit, max_limit), offset, None


def normalize_text_list(values):
    result = []
    for value in values or []:
        clean_value = str(value).strip()
        if clean_value:
            result.append(clean_value)
    return result


def parse_int_payload(value, field_name, allow_none=False):
    if value is None and allow_none:
        return None

    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be an integer")


def get_or_create_named_entities(session, model, names):
    entities = []
    for name in names:
        entity = session.query(model).filter(model.name == name).first()
        if not entity:
            entity = model(name=name)
            session.add(entity)
            session.flush()
        entities.append(entity)
    return entities


def serialize_book(book, include_copies=False):
    data = book.to_dto()
    if include_copies:
        data["copies"] = [copy.to_dto() for copy in book.copies]
    return data


def serialize_member(session, member):
    data = member.to_dto()
    data["active_loans"] = (
        session.query(Loan)
        .join(Loan.copy)
        .filter(Loan.member_id == member.id, Loan.returned_on.is_(None))
        .count()
    )
    data["active_reservations"] = (
        session.query(Reservation)
        .filter(
            Reservation.member_id == member.id,
            Reservation.status == ReservationStatus.ACTIVE,
        )
        .count()
    )
    return data


def build_book_query(session):
    query = session.query(Book).outerjoin(Book.authors).outerjoin(Book.categories).outerjoin(Book.publisher)

    q = (request.args.get("q") or "").strip()
    author = (request.args.get("author") or "").strip()
    category = (request.args.get("category") or "").strip()
    available_only = (request.args.get("available_only") or "").strip().lower() in {"1", "true", "yes"}

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Book.title.ilike(pattern),
                Book.subtitle.ilike(pattern),
                Book.isbn.ilike(pattern),
                Book.description.ilike(pattern),
                Author.name.ilike(pattern),
                Category.name.ilike(pattern),
                Publisher.name.ilike(pattern),
            )
        )

    if author:
        query = query.filter(Author.name.ilike(f"%{author}%"))

    if category:
        query = query.filter(Category.name.ilike(f"%{category}%"))

    if available_only:
        query = query.filter(Book.copies.any(BookCopy.status == CopyStatus.AVAILABLE))

    return query.distinct()


def build_member_query(session):
    query = session.query(Member)
    q = (request.args.get("q") or "").strip()
    status = (request.args.get("status") or "").strip().upper()

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Member.name.ilike(pattern),
                Member.email.ilike(pattern),
                Member.phone.ilike(pattern),
            )
        )

    if status:
        try:
            query = query.filter(Member.status == MemberStatus(status))
        except ValueError:
            query = query.filter(Member.id == -1)

    return query


def build_loan_query(session):
    query = session.query(Loan).join(Loan.member).join(Loan.copy).join(BookCopy.book)
    q = (request.args.get("q") or "").strip()
    status = (request.args.get("status") or "").strip().upper()

    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Member.name.ilike(pattern),
                Book.title.ilike(pattern),
                BookCopy.barcode.ilike(pattern),
            )
        )

    if status == "BORROWED":
        query = query.filter(Loan.returned_on.is_(None), Loan.due_on >= date.today())
    elif status == "OVERDUE":
        query = query.filter(Loan.returned_on.is_(None), Loan.due_on < date.today())
    elif status == "RETURNED":
        query = query.filter(Loan.returned_on.is_not(None))

    return query


def pick_available_copy(book, requested_copy_id=None):
    available_statuses = {CopyStatus.AVAILABLE}

    if requested_copy_id is not None:
        for copy in book.copies:
            if copy.id == requested_copy_id and copy.status in available_statuses:
                return copy
        return None

    for copy in book.copies:
        if copy.status in available_statuses:
            return copy

    return None


def create_app():
    app = Flask(__name__)
    initialize_database()
    seed_database()

    @app.get("/")
    def index():
        return jsonify(
            {
                "message": "Library API is running",
                "database": str(DB_PATH),
                "search": {
                    "books": "/api/v1/books?q=python&author=martin&category=architecture",
                    "members": "/api/v1/members?q=alice&status=ACTIVE",
                    "loans": "/api/v1/loans?q=alice&status=BORROWED",
                },
                "pagination": "Use query params limit and offset on collection endpoints",
            }
        )

    @app.get("/api/v1/health")
    def health_check():
        return jsonify({"status": "ok", "database": str(DB_PATH)})

    @app.get("/api/v1/books")
    @app.get("/api/v1/books/search")
    def get_books():
        limit, offset, error = parse_pagination()
        if error:
            return error

        session = SessionLocal()
        try:
            base_query = build_book_query(session)
            total_books = base_query.count()
            books = (
                base_query.options(
                    joinedload(Book.publisher),
                    joinedload(Book.authors),
                    joinedload(Book.categories),
                    joinedload(Book.copies),
                )
                .order_by(Book.title.asc())
                .offset(offset)
                .limit(limit)
                .all()
            )

            return jsonify(
                {
                    "metadata": {
                        "total": total_books,
                        "limit": limit,
                        "offset": offset,
                        "has_next": (offset + limit) < total_books,
                        "search": {
                            "q": request.args.get("q"),
                            "author": request.args.get("author"),
                            "category": request.args.get("category"),
                        },
                    },
                    "data": [serialize_book(book) for book in books],
                }
            )
        finally:
            session.close()

    @app.post("/api/v1/books")
    def create_book():
        payload = request.get_json(silent=True) or {}
        title = (payload.get("title") or "").strip()
        isbn = (payload.get("isbn") or "").strip()

        if not title or not isbn:
            return error_response("title and isbn are required", 400)

        session = SessionLocal()
        try:
            try:
                copy_count = max(parse_int_payload(payload.get("copy_count", 1), "copy_count"), 1)
                publication_year = payload.get("publication_year")
                if publication_year is not None:
                    publication_year = parse_int_payload(publication_year, "publication_year")
            except ValueError as exc:
                return error_response(str(exc), 400)

            authors = get_or_create_named_entities(
                session,
                Author,
                normalize_text_list(payload.get("authors")),
            )
            categories = get_or_create_named_entities(
                session,
                Category,
                normalize_text_list(payload.get("categories")),
            )

            publisher = None
            publisher_name = (payload.get("publisher_name") or "").strip()
            if publisher_name:
                publisher = session.query(Publisher).filter(Publisher.name == publisher_name).first()
                if not publisher:
                    publisher = Publisher(name=publisher_name)
                    session.add(publisher)
                    session.flush()

            shelf_code = (payload.get("shelf_code") or "").strip() or None

            book = Book(
                title=title,
                subtitle=(payload.get("subtitle") or "").strip() or None,
                isbn=isbn,
                description=(payload.get("description") or "").strip() or None,
                language=(payload.get("language") or "vi").strip(),
                publication_year=publication_year,
                shelf_code=shelf_code,
                publisher=publisher,
                authors=authors,
                categories=categories,
            )

            book.copies = [
                BookCopy(
                    barcode=f"{isbn}-COPY-{index + 1:03d}",
                    status=CopyStatus.AVAILABLE,
                    location_code=shelf_code,
                )
                for index in range(copy_count)
            ]

            session.add(book)
            session.commit()
            session.refresh(book)

            created_book = (
                session.query(Book)
                .options(
                    joinedload(Book.publisher),
                    joinedload(Book.authors),
                    joinedload(Book.categories),
                    joinedload(Book.copies),
                )
                .filter(Book.id == book.id)
                .first()
            )

            return (
                jsonify(
                    {
                        "message": "Book created successfully",
                        "data": serialize_book(created_book, include_copies=True),
                    }
                ),
                201,
            )
        except IntegrityError:
            session.rollback()
            return error_response("isbn already exists or generated barcode collided", 409)
        finally:
            session.close()

    @app.get("/api/v1/books/<int:book_id>")
    def get_book_detail(book_id):
        session = SessionLocal()
        try:
            book = (
                session.query(Book)
                .options(
                    joinedload(Book.publisher),
                    joinedload(Book.authors),
                    joinedload(Book.categories),
                    joinedload(Book.copies),
                )
                .filter(Book.id == book_id)
                .first()
            )
            if not book:
                return error_response("Book not found", 404)

            return jsonify({"data": serialize_book(book, include_copies=True)})
        finally:
            session.close()

    @app.get("/api/v1/books/<int:book_id>/copies")
    def get_book_copies(book_id):
        session = SessionLocal()
        try:
            book = (
                session.query(Book)
                .options(joinedload(Book.copies))
                .filter(Book.id == book_id)
                .first()
            )
            if not book:
                return error_response("Book not found", 404)

            return jsonify(
                {
                    "data": {
                        "book": {"id": book.id, "title": book.title, "isbn": book.isbn},
                        "copies": [copy.to_dto() for copy in book.copies],
                    }
                }
            )
        finally:
            session.close()

    @app.get("/api/v1/members")
    @app.get("/api/v1/members/search")
    def get_members():
        limit, offset, error = parse_pagination()
        if error:
            return error

        session = SessionLocal()
        try:
            base_query = build_member_query(session)
            total_members = base_query.count()
            members = base_query.order_by(Member.name.asc()).offset(offset).limit(limit).all()

            return jsonify(
                {
                    "metadata": {
                        "total": total_members,
                        "limit": limit,
                        "offset": offset,
                        "has_next": (offset + limit) < total_members,
                        "search": {
                            "q": request.args.get("q"),
                            "status": request.args.get("status"),
                        },
                    },
                    "data": [serialize_member(session, member) for member in members],
                }
            )
        finally:
            session.close()

    @app.post("/api/v1/members")
    def create_member():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        email = (payload.get("email") or "").strip()

        if not name or not email:
            return error_response("name and email are required", 400)

        session = SessionLocal()
        try:
            member = Member(
                name=name,
                email=email,
                phone=(payload.get("phone") or "").strip() or None,
                address=(payload.get("address") or "").strip() or None,
                status=MemberStatus((payload.get("status") or "ACTIVE").strip().upper()),
            )
            session.add(member)
            session.commit()
            session.refresh(member)
            return jsonify({"message": "Member created successfully", "data": member.to_dto()}), 201
        except ValueError:
            session.rollback()
            return error_response("Invalid member status", 400)
        except IntegrityError:
            session.rollback()
            return error_response("email or phone already exists", 409)
        finally:
            session.close()

    @app.get("/api/v1/members/<int:member_id>")
    def get_member_detail(member_id):
        session = SessionLocal()
        try:
            member = session.query(Member).filter(Member.id == member_id).first()
            if not member:
                return error_response("Member not found", 404)

            return jsonify({"data": serialize_member(session, member)})
        finally:
            session.close()

    @app.get("/api/v1/members/<int:member_id>/loans")
    def get_member_loans(member_id):
        limit, offset, error = parse_pagination(default_limit=5)
        if error:
            return error

        session = SessionLocal()
        try:
            member = session.query(Member).filter(Member.id == member_id).first()
            if not member:
                return error_response("Member not found", 404)

            base_query = (
                session.query(Loan)
                .options(joinedload(Loan.member), joinedload(Loan.copy).joinedload(BookCopy.book))
                .filter(Loan.member_id == member_id)
            )
            total_loans = base_query.count()
            loans = base_query.order_by(Loan.borrowed_on.desc()).offset(offset).limit(limit).all()

            return jsonify(
                {
                    "metadata": {
                        "total": total_loans,
                        "limit": limit,
                        "offset": offset,
                        "has_next": (offset + limit) < total_loans,
                    },
                    "data": [loan.to_dto() for loan in loans],
                }
            )
        finally:
            session.close()

    @app.get("/api/v1/loans")
    @app.get("/api/v1/loans/search")
    def get_loans():
        limit, offset, error = parse_pagination()
        if error:
            return error

        session = SessionLocal()
        try:
            base_query = build_loan_query(session)
            total_loans = base_query.count()
            loans = (
                base_query.options(
                    joinedload(Loan.member),
                    joinedload(Loan.copy).joinedload(BookCopy.book),
                )
                .order_by(Loan.borrowed_on.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )

            return jsonify(
                {
                    "metadata": {
                        "total": total_loans,
                        "limit": limit,
                        "offset": offset,
                        "has_next": (offset + limit) < total_loans,
                        "search": {
                            "q": request.args.get("q"),
                            "status": request.args.get("status"),
                        },
                    },
                    "data": [loan.to_dto() for loan in loans],
                }
            )
        finally:
            session.close()

    @app.post("/api/v1/members/<int:member_id>/loans")
    def create_loan(member_id):
        payload = request.get_json(silent=True) or {}
        if payload.get("book_id") is None:
            return error_response("book_id is required", 400)

        try:
            book_id = parse_int_payload(payload.get("book_id"), "book_id")
            copy_id = parse_int_payload(payload.get("copy_id"), "copy_id", allow_none=True)
        except ValueError as exc:
            return error_response(str(exc), 400)

        session = SessionLocal()
        try:
            member = session.query(Member).filter(Member.id == member_id).first()
            if not member:
                return error_response("Member not found", 404)
            if member.status != MemberStatus.ACTIVE:
                return error_response("Member is not allowed to borrow books", 409)

            book = (
                session.query(Book)
                .options(joinedload(Book.copies), joinedload(Book.authors), joinedload(Book.categories))
                .filter(Book.id == book_id)
                .first()
            )
            if not book:
                return error_response("Book not found", 404)

            selected_copy = pick_available_copy(book, requested_copy_id=copy_id)
            if not selected_copy:
                return error_response("No available copy for this book", 409)

            selected_copy.status = CopyStatus.LOANED
            new_loan = Loan(
                member_id=member_id,
                copy_id=selected_copy.id,
                borrowed_on=date.today(),
                due_on=date.today() + timedelta(days=14),
            )
            session.add(new_loan)
            session.commit()
            session.refresh(new_loan)

            created_loan = (
                session.query(Loan)
                .options(joinedload(Loan.member), joinedload(Loan.copy).joinedload(BookCopy.book))
                .filter(Loan.id == new_loan.id)
                .first()
            )

            return (
                jsonify({"message": "Loan created successfully", "data": created_loan.to_dto()}),
                201,
            )
        finally:
            session.close()

    @app.get("/api/v1/loans/<int:loan_id>")
    def get_loan_detail(loan_id):
        session = SessionLocal()
        try:
            loan = (
                session.query(Loan)
                .options(joinedload(Loan.member), joinedload(Loan.copy).joinedload(BookCopy.book))
                .filter(Loan.id == loan_id)
                .first()
            )
            if not loan:
                return error_response("Loan not found", 404)

            return jsonify({"data": loan.to_dto()})
        finally:
            session.close()

    @app.post("/api/v1/loans/<int:loan_id>/return")
    def return_loan(loan_id):
        session = SessionLocal()
        try:
            loan = (
                session.query(Loan)
                .options(joinedload(Loan.copy).joinedload(BookCopy.book))
                .filter(Loan.id == loan_id)
                .first()
            )
            if not loan:
                return error_response("Loan not found", 404)
            if loan.returned_on:
                return error_response("Loan already returned", 409)

            loan.returned_on = date.today()

            pending_reservation = (
                session.query(Reservation)
                .filter(
                    Reservation.book_id == loan.book.id,
                    Reservation.status == ReservationStatus.ACTIVE,
                )
                .order_by(Reservation.reserved_at.asc())
                .first()
            )

            if pending_reservation:
                loan.copy.status = CopyStatus.RESERVED
                pending_reservation.status = ReservationStatus.FULFILLED
                pending_reservation.fulfilled_copy_id = loan.copy.id
            else:
                loan.copy.status = CopyStatus.AVAILABLE

            session.commit()
            session.refresh(loan)

            returned_loan = (
                session.query(Loan)
                .options(joinedload(Loan.member), joinedload(Loan.copy).joinedload(BookCopy.book))
                .filter(Loan.id == loan.id)
                .first()
            )
            return jsonify(
                {"message": "Loan returned successfully", "data": returned_loan.to_dto()}
            )
        finally:
            session.close()

    @app.get("/api/v1/reservations")
    def get_reservations():
        limit, offset, error = parse_pagination()
        if error:
            return error

        session = SessionLocal()
        try:
            q = (request.args.get("q") or "").strip()
            base_query = session.query(Reservation).join(Reservation.member).join(Reservation.book)

            if q:
                pattern = f"%{q}%"
                base_query = base_query.filter(
                    or_(Member.name.ilike(pattern), Book.title.ilike(pattern))
                )

            total_reservations = base_query.count()
            reservations = (
                base_query.options(
                    joinedload(Reservation.member),
                    joinedload(Reservation.book),
                    joinedload(Reservation.fulfilled_copy),
                )
                .order_by(Reservation.reserved_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )

            return jsonify(
                {
                    "metadata": {
                        "total": total_reservations,
                        "limit": limit,
                        "offset": offset,
                        "has_next": (offset + limit) < total_reservations,
                        "search": {"q": request.args.get("q")},
                    },
                    "data": [reservation.to_dto() for reservation in reservations],
                }
            )
        finally:
            session.close()

    @app.post("/api/v1/reservations")
    def create_reservation():
        payload = request.get_json(silent=True) or {}
        if payload.get("member_id") is None or payload.get("book_id") is None:
            return error_response("member_id and book_id are required", 400)

        try:
            member_id = parse_int_payload(payload.get("member_id"), "member_id")
            book_id = parse_int_payload(payload.get("book_id"), "book_id")
        except ValueError as exc:
            return error_response(str(exc), 400)

        session = SessionLocal()
        try:
            member = session.query(Member).filter(Member.id == member_id).first()
            if not member:
                return error_response("Member not found", 404)

            book = (
                session.query(Book)
                .options(joinedload(Book.copies))
                .filter(Book.id == book_id)
                .first()
            )
            if not book:
                return error_response("Book not found", 404)

            if any(copy.status == CopyStatus.AVAILABLE for copy in book.copies):
                return error_response("Book has available copies; create a loan instead", 409)

            existing_reservation = (
                session.query(Reservation)
                .filter(
                    Reservation.member_id == member_id,
                    Reservation.book_id == book_id,
                    Reservation.status == ReservationStatus.ACTIVE,
                )
                .first()
            )
            if existing_reservation:
                return error_response("Active reservation already exists", 409)

            reservation = Reservation(
                member_id=member_id,
                book_id=book_id,
                reserved_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=3),
                status=ReservationStatus.ACTIVE,
                note=(payload.get("note") or "").strip() or None,
            )
            session.add(reservation)
            session.commit()
            session.refresh(reservation)

            created_reservation = (
                session.query(Reservation)
                .options(joinedload(Reservation.member), joinedload(Reservation.book))
                .filter(Reservation.id == reservation.id)
                .first()
            )
            return (
                jsonify(
                    {
                        "message": "Reservation created successfully",
                        "data": created_reservation.to_dto(),
                    }
                ),
                201,
            )
        finally:
            session.close()

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
