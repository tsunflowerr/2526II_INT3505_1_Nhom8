from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import StrEnum


class MemberStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class CopyStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    LOANED = "LOANED"
    RESERVED = "RESERVED"
    LOST = "LOST"
    MAINTENANCE = "MAINTENANCE"


class ReservationStatus(StrEnum):
    ACTIVE = "ACTIVE"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


@dataclass(slots=True)
class PublisherEntity:
    id: int | None
    name: str
    country: str | None = None
    website: str | None = None


@dataclass(slots=True)
class AuthorEntity:
    id: int | None
    name: str
    biography: str | None = None


@dataclass(slots=True)
class CategoryEntity:
    id: int | None
    name: str
    description: str | None = None


@dataclass(slots=True)
class BookCopyEntity:
    id: int | None
    book_id: int
    barcode: str
    status: CopyStatus
    location_code: str | None = None
    acquired_on: date | None = None
    condition_note: str | None = None


@dataclass(slots=True)
class BookEntity:
    id: int | None
    title: str
    isbn: str
    subtitle: str | None = None
    description: str | None = None
    language: str = "vi"
    publication_year: int | None = None
    shelf_code: str | None = None
    publisher: PublisherEntity | None = None
    authors: list[AuthorEntity] = field(default_factory=list)
    categories: list[CategoryEntity] = field(default_factory=list)
    copies: list[BookCopyEntity] = field(default_factory=list)

    @property
    def total_copies(self) -> int:
        return len(self.copies)

    @property
    def available_copies(self) -> int:
        return sum(1 for copy in self.copies if copy.status == CopyStatus.AVAILABLE)


@dataclass(slots=True)
class MemberEntity:
    id: int | None
    name: str
    email: str
    phone: str | None = None
    address: str | None = None
    status: MemberStatus = MemberStatus.ACTIVE
    joined_at: datetime | None = None


@dataclass(slots=True)
class LoanEntity:
    id: int | None
    member_id: int
    copy_id: int
    borrowed_on: date
    due_on: date
    returned_on: date | None = None

    @property
    def status(self) -> str:
        if self.returned_on:
            return "RETURNED"
        if self.due_on < date.today():
            return "OVERDUE"
        return "BORROWED"


@dataclass(slots=True)
class ReservationEntity:
    id: int | None
    member_id: int
    book_id: int
    reserved_at: datetime
    status: ReservationStatus = ReservationStatus.ACTIVE
    expires_at: datetime | None = None
    fulfilled_copy_id: int | None = None
    note: str | None = None
