from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

try:
    from .domain.entities import CopyStatus, MemberStatus, ReservationStatus
    from .models import (
        Author,
        Base,
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
    from models import (
        Author,
        Base,
        Book,
        BookCopy,
        Category,
        Loan,
        Member,
        Publisher,
        Reservation,
    )


DB_PATH = Path(__file__).with_name("library_management.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


def initialize_database():
    Base.metadata.create_all(bind=engine)


def rebuild_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_database():
    initialize_database()
    session = SessionLocal()

    try:
        if session.query(Book).first():
            print(f"Database already initialized at: {DB_PATH}")
            return

        oreilly = Publisher(name="O'Reilly Media", country="USA", website="https://www.oreilly.com")
        no_starch = Publisher(
            name="No Starch Press",
            country="USA",
            website="https://nostarch.com",
        )

        python_author = Author(name="Mark Lutz")
        architecture_author = Author(name="Martin Fowler")
        clean_code_author = Author(name="Robert C. Martin")
        ai_author = Author(name="Andrew Ng")

        python_category = Category(name="Programming", description="Software development books")
        architecture_category = Category(name="Architecture", description="System design and architecture")
        ai_category = Category(name="AI", description="Artificial intelligence and machine learning")

        python_book = Book(
            title="Learning Python",
            subtitle="Powerful Object-Oriented Programming",
            isbn="978-0596158064",
            description="Comprehensive Python guide for developers.",
            language="en",
            publication_year=2013,
            shelf_code="P-01",
            publisher=oreilly,
            authors=[python_author],
            categories=[python_category],
        )
        python_book.copies = [
            BookCopy(barcode="COPY-PY-001", location_code="A1", status=CopyStatus.LOANED),
            BookCopy(barcode="COPY-PY-002", location_code="A1", status=CopyStatus.AVAILABLE),
        ]

        architecture_book = Book(
            title="Patterns of Enterprise Application Architecture",
            isbn="978-0321127426",
            description="Classic reference for enterprise architecture patterns.",
            language="en",
            publication_year=2002,
            shelf_code="A-02",
            publisher=oreilly,
            authors=[architecture_author],
            categories=[architecture_category, python_category],
        )
        architecture_book.copies = [
            BookCopy(barcode="COPY-ARC-001", location_code="B4", status=CopyStatus.LOANED),
            BookCopy(barcode="COPY-ARC-002", location_code="B4", status=CopyStatus.RESERVED),
        ]

        clean_code_book = Book(
            title="Clean Code",
            isbn="978-0132350884",
            description="Guide to writing maintainable code.",
            language="en",
            publication_year=2008,
            shelf_code="P-03",
            publisher=no_starch,
            authors=[clean_code_author],
            categories=[python_category, architecture_category],
        )
        clean_code_book.copies = [
            BookCopy(barcode="COPY-CC-001", location_code="A3", status=CopyStatus.AVAILABLE),
            BookCopy(barcode="COPY-CC-002", location_code="A3", status=CopyStatus.MAINTENANCE),
        ]

        ai_book = Book(
            title="Machine Learning Yearning",
            isbn="978-1999579500",
            description="Practical strategy book for AI projects.",
            language="en",
            publication_year=2018,
            shelf_code="AI-01",
            publisher=no_starch,
            authors=[ai_author],
            categories=[ai_category],
        )
        ai_book.copies = [
            BookCopy(barcode="COPY-AI-001", location_code="C2", status=CopyStatus.AVAILABLE),
            BookCopy(barcode="COPY-AI-002", location_code="C2", status=CopyStatus.AVAILABLE),
        ]

        alice = Member(
            name="Alice Nguyen",
            email="alice@example.com",
            phone="0900000001",
            address="District 1, HCMC",
            status=MemberStatus.ACTIVE,
        )
        bob = Member(
            name="Bob Tran",
            email="bob@example.com",
            phone="0900000002",
            address="Thu Duc, HCMC",
            status=MemberStatus.ACTIVE,
        )
        charlie = Member(
            name="Charlie Pham",
            email="charlie@example.com",
            phone="0900000003",
            address="Da Nang",
            status=MemberStatus.SUSPENDED,
        )

        session.add_all(
            [
                oreilly,
                no_starch,
                python_author,
                architecture_author,
                clean_code_author,
                ai_author,
                python_category,
                architecture_category,
                ai_category,
                python_book,
                architecture_book,
                clean_code_book,
                ai_book,
                alice,
                bob,
                charlie,
            ]
        )
        session.flush()

        session.add_all(
            [
                Loan(
                    member_id=alice.id,
                    copy_id=python_book.copies[0].id,
                    borrowed_on=date.today() - timedelta(days=3),
                    due_on=date.today() + timedelta(days=11),
                ),
                Loan(
                    member_id=bob.id,
                    copy_id=architecture_book.copies[0].id,
                    borrowed_on=date.today() - timedelta(days=10),
                    due_on=date.today() + timedelta(days=4),
                ),
                Reservation(
                    member_id=charlie.id,
                    book_id=architecture_book.id,
                    reserved_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(days=2),
                    status=ReservationStatus.ACTIVE,
                    fulfilled_copy_id=architecture_book.copies[1].id,
                    note="Waiting for suspension review before pickup",
                ),
            ]
        )
        session.commit()

        print(f"Database seeded with mock data at: {DB_PATH}")
    finally:
        session.close()


def show_summary():
    session = SessionLocal()

    try:
        print(f"SQLite database: {DB_PATH}")
        print(f"Books: {session.query(Book).count()}")
        print(f"Copies: {session.query(BookCopy).count()}")
        print(f"Members: {session.query(Member).count()}")
        print(f"Loans: {session.query(Loan).count()}")
        print(f"Reservations: {session.query(Reservation).count()}")
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
    show_summary()
