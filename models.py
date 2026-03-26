from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

try:
    from .domain.entities import (
        AuthorEntity,
        BookCopyEntity,
        BookEntity,
        CategoryEntity,
        CopyStatus,
        LoanEntity,
        MemberEntity,
        MemberStatus,
        PublisherEntity,
        ReservationEntity,
        ReservationStatus,
    )
except ImportError:
    from domain.entities import (
        AuthorEntity,
        BookCopyEntity,
        BookEntity,
        CategoryEntity,
        CopyStatus,
        LoanEntity,
        MemberEntity,
        MemberStatus,
        PublisherEntity,
        ReservationEntity,
        ReservationStatus,
    )


Base = declarative_base()


book_author_links = Table(
    "book_author_links",
    Base.metadata,
    Column("book_id", ForeignKey("books.id"), primary_key=True),
    Column("author_id", ForeignKey("authors.id"), primary_key=True),
)


book_category_links = Table(
    "book_category_links",
    Base.metadata,
    Column("book_id", ForeignKey("books.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id"), primary_key=True),
)


class Publisher(Base):
    __tablename__ = "publishers"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), unique=True, nullable=False)
    country = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)

    books = relationship("Book", back_populates="publisher")

    def to_dto(self):
        return {
            "id": self.id,
            "name": self.name,
            "country": self.country,
            "website": self.website,
        }

    def to_entity(self):
        return PublisherEntity(
            id=self.id,
            name=self.name,
            country=self.country,
            website=self.website,
        )


class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), unique=True, nullable=False)
    biography = Column(Text, nullable=True)

    books = relationship("Book", secondary=book_author_links, back_populates="authors")

    def to_dto(self):
        return {"id": self.id, "name": self.name, "biography": self.biography}

    def to_entity(self):
        return AuthorEntity(id=self.id, name=self.name, biography=self.biography)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    books = relationship("Book", secondary=book_category_links, back_populates="categories")

    def to_dto(self):
        return {"id": self.id, "name": self.name, "description": self.description}

    def to_entity(self):
        return CategoryEntity(id=self.id, name=self.name, description=self.description)


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(200), nullable=True)
    isbn = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(20), nullable=False, default="vi")
    publication_year = Column(Integer, nullable=True)
    shelf_code = Column(String(50), nullable=True)
    publisher_id = Column(Integer, ForeignKey("publishers.id"), nullable=True)

    publisher = relationship("Publisher", back_populates="books")
    authors = relationship("Author", secondary=book_author_links, back_populates="books")
    categories = relationship(
        "Category",
        secondary=book_category_links,
        back_populates="books",
    )
    copies = relationship(
        "BookCopy",
        back_populates="book",
        cascade="all, delete-orphan",
    )
    reservations = relationship("Reservation", back_populates="book")

    def to_dto(self):
        total_copies = len(self.copies)
        available_copies = sum(
            1 for copy in self.copies if copy.status == CopyStatus.AVAILABLE
        )
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "isbn": self.isbn,
            "description": self.description,
            "language": self.language,
            "publication_year": self.publication_year,
            "shelf_code": self.shelf_code,
            "publisher": self.publisher.to_dto() if self.publisher else None,
            "authors": [author.to_dto() for author in self.authors],
            "categories": [category.to_dto() for category in self.categories],
            "total_copies": total_copies,
            "available_copies": available_copies,
        }

    def to_entity(self):
        return BookEntity(
            id=self.id,
            title=self.title,
            subtitle=self.subtitle,
            isbn=self.isbn,
            description=self.description,
            language=self.language,
            publication_year=self.publication_year,
            shelf_code=self.shelf_code,
            publisher=self.publisher.to_entity() if self.publisher else None,
            authors=[author.to_entity() for author in self.authors],
            categories=[category.to_entity() for category in self.categories],
            copies=[copy.to_entity() for copy in self.copies],
        )


class BookCopy(Base):
    __tablename__ = "book_copies"

    id = Column(Integer, primary_key=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    barcode = Column(String(50), unique=True, nullable=False)
    status = Column(
        SQLEnum(CopyStatus, native_enum=False, length=20),
        nullable=False,
        default=CopyStatus.AVAILABLE,
    )
    location_code = Column(String(50), nullable=True)
    acquired_on = Column(Date, nullable=False, default=date.today)
    condition_note = Column(Text, nullable=True)

    book = relationship("Book", back_populates="copies")
    loans = relationship("Loan", back_populates="copy")
    fulfilled_reservations = relationship(
        "Reservation",
        back_populates="fulfilled_copy",
        foreign_keys="Reservation.fulfilled_copy_id",
    )

    def to_dto(self):
        return {
            "id": self.id,
            "book_id": self.book_id,
            "barcode": self.barcode,
            "status": self.status.value if self.status else None,
            "location_code": self.location_code,
            "acquired_on": self.acquired_on.isoformat() if self.acquired_on else None,
            "condition_note": self.condition_note,
        }

    def to_entity(self):
        return BookCopyEntity(
            id=self.id,
            book_id=self.book_id,
            barcode=self.barcode,
            status=self.status,
            location_code=self.location_code,
            acquired_on=self.acquired_on,
            condition_note=self.condition_note,
        )


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    address = Column(String(255), nullable=True)
    status = Column(
        SQLEnum(MemberStatus, native_enum=False, length=20),
        nullable=False,
        default=MemberStatus.ACTIVE,
    )
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    loans = relationship("Loan", back_populates="member")
    reservations = relationship("Reservation", back_populates="member")

    def to_dto(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "status": self.status.value if self.status else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }

    def to_entity(self):
        return MemberEntity(
            id=self.id,
            name=self.name,
            email=self.email,
            phone=self.phone,
            address=self.address,
            status=self.status,
            joined_at=self.joined_at,
        )


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    copy_id = Column(Integer, ForeignKey("book_copies.id"), nullable=False)
    borrowed_on = Column(Date, nullable=False, default=date.today)
    due_on = Column(Date, nullable=False)
    returned_on = Column(Date, nullable=True)

    member = relationship("Member", back_populates="loans")
    copy = relationship("BookCopy", back_populates="loans")

    @property
    def book(self):
        return self.copy.book if self.copy else None

    @property
    def status(self):
        if self.returned_on:
            return "RETURNED"
        if self.due_on and self.due_on < date.today():
            return "OVERDUE"
        return "BORROWED"

    def to_dto(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "member_name": self.member.name if self.member else None,
            "copy_id": self.copy_id,
            "barcode": self.copy.barcode if self.copy else None,
            "book_id": self.book.id if self.book else None,
            "book_title": self.book.title if self.book else None,
            "borrowed_on": self.borrowed_on.isoformat() if self.borrowed_on else None,
            "due_on": self.due_on.isoformat() if self.due_on else None,
            "returned_on": self.returned_on.isoformat() if self.returned_on else None,
            "status": self.status,
        }

    def to_entity(self):
        return LoanEntity(
            id=self.id,
            member_id=self.member_id,
            copy_id=self.copy_id,
            borrowed_on=self.borrowed_on,
            due_on=self.due_on,
            returned_on=self.returned_on,
        )


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    reserved_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    status = Column(
        SQLEnum(ReservationStatus, native_enum=False, length=20),
        nullable=False,
        default=ReservationStatus.ACTIVE,
    )
    fulfilled_copy_id = Column(Integer, ForeignKey("book_copies.id"), nullable=True)
    note = Column(Text, nullable=True)

    member = relationship("Member", back_populates="reservations")
    book = relationship("Book", back_populates="reservations")
    fulfilled_copy = relationship(
        "BookCopy",
        back_populates="fulfilled_reservations",
        foreign_keys=[fulfilled_copy_id],
    )

    def to_dto(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "member_name": self.member.name if self.member else None,
            "book_id": self.book_id,
            "book_title": self.book.title if self.book else None,
            "reserved_at": self.reserved_at.isoformat() if self.reserved_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "status": self.status.value if self.status else None,
            "fulfilled_copy_id": self.fulfilled_copy_id,
            "note": self.note,
        }

    def to_entity(self):
        return ReservationEntity(
            id=self.id,
            member_id=self.member_id,
            book_id=self.book_id,
            reserved_at=self.reserved_at,
            status=self.status,
            expires_at=self.expires_at,
            fulfilled_copy_id=self.fulfilled_copy_id,
            note=self.note,
        )
