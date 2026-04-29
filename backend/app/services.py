from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.models import (
    Booking,
    CalendarOwner,
    CreateBookingRequest,
    CreateEventTypeRequest,
    EventType,
    Slot,
    UpdateEventTypeRequest,
)
from app.storage import OWNER_ID, OWNER_TIMEZONE, InMemoryStorage, storage

SLOT_DAYS_AHEAD = 14
WORKDAY_START = time(hour=9)
WORKDAY_END = time(hour=18)


class CalendarService:
    def __init__(self, repository: InMemoryStorage) -> None:
        self.repository = repository

    def get_owner(self) -> CalendarOwner:
        return self.repository.owner

    def list_event_types(self) -> list[EventType]:
        return self.repository.list_event_types()

    def get_event_type(self, event_type_id: str) -> EventType | None:
        return self.repository.get_event_type(event_type_id)

    def list_slots(
        self,
        event_type: EventType,
        from_at: datetime | None,
        to_at: datetime | None,
    ) -> list[Slot]:
        now = self._now()
        horizon_end = now + timedelta(days=SLOT_DAYS_AHEAD)
        lower_bound = self._normalize_datetime(from_at) if from_at else now
        upper_bound = self._normalize_datetime(to_at) if to_at else horizon_end

        if lower_bound > upper_bound:
            raise ValueError("Параметр from должен быть раньше или равен параметру to.")

        if upper_bound > horizon_end:
            raise ValueError("Параметр to не должен выходить за ближайшие 14 дней.")

        slots: list[Slot] = []
        current_day = now.astimezone(ZoneInfo(OWNER_TIMEZONE)).date()
        last_day = horizon_end.astimezone(ZoneInfo(OWNER_TIMEZONE)).date()

        while current_day <= last_day:
            slots.extend(self._slots_for_day(event_type, current_day, lower_bound, upper_bound))
            current_day += timedelta(days=1)

        return slots

    def list_owner_bookings(
        self,
        from_at: datetime | None,
        to_at: datetime | None,
    ) -> list[Booking]:
        lower_bound = self._normalize_datetime(from_at) if from_at else self._now()
        upper_bound = self._normalize_datetime(to_at) if to_at else None

        if upper_bound and lower_bound > upper_bound:
            raise ValueError("Параметр from должен быть раньше или равен параметру to.")

        bookings = [booking for booking in self.repository.list_bookings() if booking.start_at >= lower_bound]
        if upper_bound:
            bookings = [booking for booking in bookings if booking.start_at <= upper_bound]

        return sorted(bookings, key=lambda booking: booking.start_at)

    def create_booking(self, request: CreateBookingRequest, event_type: EventType) -> Booking:
        start_at = self._normalize_datetime(request.start_at)
        end_at = start_at + timedelta(minutes=event_type.duration_minutes)

        self._validate_slot_range(start_at, end_at)
        if self._has_overlapping_booking(start_at, end_at):
            raise ValueError("slot_unavailable")

        booking = Booking(
            id=self.repository.next_booking_id(),
            eventTypeId=event_type.id,
            ownerId=OWNER_ID,
            guestName=request.guest_name.strip(),
            guestContact=request.guest_contact.strip(),
            startAt=start_at,
            endAt=end_at,
            createdAt=self._now(),
        )
        return self.repository.add_booking(booking)

    def create_event_type(self, request: CreateEventTypeRequest) -> EventType:
        event_type = EventType(
            id=self.repository.next_event_type_id(request.title),
            title=request.title.strip(),
            description=request.description.strip(),
            durationMinutes=request.duration_minutes,
            ownerId=OWNER_ID,
        )
        return self.repository.add_event_type(event_type)

    def update_event_type(self, event_type: EventType, request: UpdateEventTypeRequest) -> EventType:
        updated = event_type.model_copy(
            update={
                key: value
                for key, value in {
                    "title": request.title.strip() if request.title is not None else None,
                    "description": request.description.strip() if request.description is not None else None,
                    "duration_minutes": request.duration_minutes,
                }.items()
                if value is not None
            }
        )
        return self.repository.replace_event_type(updated)

    def delete_event_type(self, event_type_id: str) -> None:
        self.repository.delete_event_type(event_type_id)

    def _slots_for_day(
        self,
        event_type: EventType,
        day: date,
        lower_bound: datetime,
        upper_bound: datetime,
    ) -> list[Slot]:
        timezone = ZoneInfo(OWNER_TIMEZONE)
        current = datetime.combine(day, WORKDAY_START, tzinfo=timezone).astimezone(UTC)
        workday_end = datetime.combine(day, WORKDAY_END, tzinfo=timezone).astimezone(UTC)
        duration = timedelta(minutes=event_type.duration_minutes)
        slots: list[Slot] = []

        while current + duration <= workday_end:
            end_at = current + duration
            overlapping_booking = self._find_overlapping_booking(current, end_at)
            if overlapping_booking is not None:
                current = overlapping_booking.end_at
                continue

            if lower_bound <= current <= upper_bound:
                slots.append(
                    Slot(
                        startAt=current,
                        endAt=end_at,
                        eventTypeId=event_type.id,
                        durationMinutes=event_type.duration_minutes,
                        isAvailable=True,
                    )
                )
            current += duration

        return slots

    def _validate_slot_range(self, start_at: datetime, end_at: datetime) -> None:
        now = self._now()
        if start_at < now:
            raise ValueError("Нельзя забронировать слот в прошлом.")
        if start_at > now + timedelta(days=SLOT_DAYS_AHEAD):
            raise ValueError("Начало бронирования должно быть в пределах ближайших 14 дней.")

        local_start = start_at.astimezone(ZoneInfo(OWNER_TIMEZONE))
        local_end = end_at.astimezone(ZoneInfo(OWNER_TIMEZONE))
        if local_start.date() != local_end.date():
            raise ValueError("Бронирование должно помещаться в один рабочий день.")
        if local_start.time() < WORKDAY_START or local_end.time() > WORKDAY_END:
            raise ValueError("Бронирование должно попадать в рабочее окно с 09:00 до 18:00.")

    def _has_overlapping_booking(self, start_at: datetime, end_at: datetime) -> bool:
        return any(
            start_at < booking.end_at and booking.start_at < end_at for booking in self.repository.list_bookings()
        )

    def _find_overlapping_booking(self, start_at: datetime, end_at: datetime) -> Booking | None:
        overlapping_bookings = [
            booking
            for booking in self.repository.list_bookings()
            if start_at < booking.end_at and booking.start_at < end_at
        ]
        if not overlapping_bookings:
            return None

        return max(overlapping_bookings, key=lambda booking: booking.end_at)

    def _normalize_datetime(self, value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    def _now(self) -> datetime:
        return datetime.now(UTC)


calendar_service = CalendarService(storage)
