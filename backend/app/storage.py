from itertools import count
from re import sub

from app.models import (
    Booking,
    CalendarOwner,
    EventType,
)

OWNER_ID = "owner_default"
OWNER_TIMEZONE = "Europe/Moscow"


class InMemoryStorage:
    def __init__(self) -> None:
        self.owner = CalendarOwner(
            id=OWNER_ID,
            name="Александр Пушкин",
            timezone=OWNER_TIMEZONE,
        )
        self.event_types: dict[str, EventType] = {
            "intro_call_30": EventType(
                id="intro_call_30",
                title="Знакомство",
                description="Короткая встреча, чтобы обсудить цели и следующие шаги.",
                durationMinutes=30,
                ownerId=OWNER_ID,
            ),
            "product_strategy_60": EventType(
                id="product_strategy_60",
                title="Продуктовая стратегия",
                description="Подробная сессия планирования для продуктовой команды.",
                durationMinutes=60,
                ownerId=OWNER_ID,
            ),
        }
        self.bookings: dict[str, Booking] = {}
        self._booking_sequence = count(1)
        self._event_type_sequence = count(1)

    def list_event_types(self) -> list[EventType]:
        return list(self.event_types.values())

    def get_event_type(self, event_type_id: str) -> EventType | None:
        return self.event_types.get(event_type_id)

    def list_bookings(self) -> list[Booking]:
        return list(self.bookings.values())

    def add_booking(self, booking: Booking) -> Booking:
        self.bookings[booking.id] = booking
        return booking

    def add_event_type(self, event_type: EventType) -> EventType:
        self.event_types[event_type.id] = event_type
        return event_type

    def replace_event_type(self, event_type: EventType) -> EventType:
        self.event_types[event_type.id] = event_type
        return event_type

    def delete_event_type(self, event_type_id: str) -> None:
        del self.event_types[event_type_id]

    def next_booking_id(self) -> str:
        return f"booking_{next(self._booking_sequence):08d}"

    def next_event_type_id(self, title: str) -> str:
        slug = sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
        if not slug:
            slug = "event_type"

        while True:
            event_type_id = f"{slug}_{next(self._event_type_sequence)}"
            if event_type_id not in self.event_types:
                return event_type_id


storage = InMemoryStorage()
