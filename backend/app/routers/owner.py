from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query, Response, status

from app.errors import bad_request, not_found
from app.models import (
    Booking,
    CalendarOwner,
    CreateEventTypeRequest,
    EventType,
    UpdateEventTypeRequest,
)
from app.services import calendar_service

router = APIRouter(prefix="/api/owner", tags=["owner"])


@router.get("")
def get_owner() -> CalendarOwner:
    return calendar_service.get_owner()


@router.get("/bookings")
def list_owner_bookings(
    from_at: Annotated[datetime | None, Query(alias="from")] = None,
    to_at: Annotated[datetime | None, Query(alias="to")] = None,
) -> list[Booking]:
    try:
        return calendar_service.list_owner_bookings(from_at, to_at)
    except ValueError as error:
        raise bad_request(str(error)) from error


@router.get("/event-types")
def list_owner_event_types() -> list[EventType]:
    return calendar_service.list_event_types()


@router.post("/event-types")
def create_event_type(event_type: CreateEventTypeRequest) -> EventType:
    return calendar_service.create_event_type(event_type)


@router.patch("/event-types/{event_type_id}")
def update_event_type(event_type_id: str, event_type_update: UpdateEventTypeRequest) -> EventType:
    event_type = calendar_service.get_event_type(event_type_id)
    if event_type is None:
        raise not_found("Тип события не найден.")

    return calendar_service.update_event_type(event_type, event_type_update)


@router.delete("/event-types/{event_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_type(event_type_id: str) -> Response:
    if calendar_service.get_event_type(event_type_id) is None:
        raise not_found("Тип события не найден.")

    calendar_service.delete_event_type(event_type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
