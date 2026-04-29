from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query

from app.errors import bad_request, not_found, slot_unavailable
from app.models import Booking, CreateBookingRequest, EventType, Slot
from app.services import calendar_service

router = APIRouter(prefix="/api", tags=["public"])


@router.get("/event-types")
def list_event_types() -> list[EventType]:
    return calendar_service.list_event_types()


@router.get("/event-types/{event_type_id}/slots")
def list_slots(
    event_type_id: str,
    from_at: Annotated[datetime | None, Query(alias="from")] = None,
    to_at: Annotated[datetime | None, Query(alias="to")] = None,
) -> list[Slot]:
    event_type = calendar_service.get_event_type(event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден.")

    try:
        return calendar_service.list_slots(event_type, from_at, to_at)
    except ValueError as error:
        raise bad_request(str(error)) from error


@router.post("/bookings")
def create_booking(booking: CreateBookingRequest) -> Booking:
    event_type = calendar_service.get_event_type(booking.event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден.")

    try:
        return calendar_service.create_booking(booking, event_type)
    except ValueError as error:
        if str(error) == "slot_unavailable":
            raise slot_unavailable() from error
        raise bad_request(str(error)) from error
