from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CalendarOwner(BaseModel):
    id: str
    name: str
    timezone: str


class EventType(BaseModel):
    id: str
    title: str
    description: str
    duration_minutes: int = Field(alias="durationMinutes", gt=0)
    owner_id: str = Field(alias="ownerId")

    model_config = ConfigDict(populate_by_name=True)


class CreateEventTypeRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    duration_minutes: int = Field(alias="durationMinutes", gt=0)

    model_config = ConfigDict(populate_by_name=True)


class UpdateEventTypeRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = Field(default=None, min_length=1)
    duration_minutes: int | None = Field(default=None, alias="durationMinutes", gt=0)

    model_config = ConfigDict(populate_by_name=True)


class Slot(BaseModel):
    start_at: datetime = Field(alias="startAt")
    end_at: datetime = Field(alias="endAt")
    event_type_id: str = Field(alias="eventTypeId")
    duration_minutes: int = Field(alias="durationMinutes")
    is_available: bool = Field(alias="isAvailable")

    model_config = ConfigDict(populate_by_name=True)


class Booking(BaseModel):
    id: str
    event_type_id: str = Field(alias="eventTypeId")
    owner_id: str = Field(alias="ownerId")
    guest_name: str = Field(alias="guestName")
    guest_contact: str = Field(alias="guestContact")
    start_at: datetime = Field(alias="startAt")
    end_at: datetime = Field(alias="endAt")
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True)


class CreateBookingRequest(BaseModel):
    event_type_id: str = Field(alias="eventTypeId")
    start_at: datetime = Field(alias="startAt")
    guest_name: str = Field(alias="guestName", min_length=1)
    guest_contact: str = Field(alias="guestContact", min_length=1)

    model_config = ConfigDict(populate_by_name=True)
