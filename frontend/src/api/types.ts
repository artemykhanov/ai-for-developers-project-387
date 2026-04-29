export interface CalendarOwner {
  id: string;
  name: string;
  timezone: string;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  ownerId: string;
}

export interface Slot {
  startAt: string;
  endAt: string;
  eventTypeId: string;
  durationMinutes: number;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  ownerId: string;
  guestName: string;
  guestContact: string;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  eventTypeId: string;
  startAt: string;
  guestName: string;
  guestContact: string;
}

export interface CreateEventTypeRequest {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface UpdateEventTypeRequest {
  title?: string;
  description?: string;
  durationMinutes?: number;
}

export interface ApiErrorBody {
  code: 'bad_request' | 'not_found' | 'slot_unavailable' | string;
  message: string;
  statusCode?: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.message || `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
  }
}
