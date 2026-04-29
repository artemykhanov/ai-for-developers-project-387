import type {
  Booking,
  CalendarOwner,
  CreateBookingRequest,
  CreateEventTypeRequest,
  EventType,
  Slot,
  UpdateEventTypeRequest,
  ApiErrorBody,
} from './types';
import { ApiError } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, data as ApiErrorBody | undefined);
  }

  return data as T;
}

function query(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const value = search.toString();
  return value ? `?${value}` : '';
}

export const api = {
  listEventTypes: () => request<EventType[]>('/event-types'),
  listSlots: (eventTypeId: string, params: { from?: string; to?: string } = {}) =>
    request<Slot[]>(`/event-types/${encodeURIComponent(eventTypeId)}/slots${query(params)}`),
  createBooking: (booking: CreateBookingRequest) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(booking) }),
  getOwner: () => request<CalendarOwner>('/owner'),
  listOwnerBookings: (params: { from?: string; to?: string } = {}) =>
    request<Booking[]>(`/owner/bookings${query(params)}`),
  listOwnerEventTypes: () => request<EventType[]>('/owner/event-types'),
  createEventType: (eventType: CreateEventTypeRequest) =>
    request<EventType>('/owner/event-types', { method: 'POST', body: JSON.stringify(eventType) }),
  updateEventType: (eventTypeId: string, eventType: UpdateEventTypeRequest) =>
    request<EventType>(`/owner/event-types/${encodeURIComponent(eventTypeId)}`, {
      method: 'PATCH',
      body: JSON.stringify(eventType),
    }),
  deleteEventType: (eventTypeId: string) =>
    request<void>(`/owner/event-types/${encodeURIComponent(eventTypeId)}`, { method: 'DELETE' }),
};
