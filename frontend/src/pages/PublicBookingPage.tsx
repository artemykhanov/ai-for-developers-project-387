import { Badge, Button, Card, Group, Modal, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ApiError, type CalendarOwner, type EventType, type Slot } from '../api/types';
import BookingForm from '../components/BookingForm';
import EventTypeCard from '../components/EventTypeCard';
import SlotPicker from '../components/SlotPicker';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';

export default function PublicBookingPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [owner, setOwner] = useState<CalendarOwner>();
  const [selectedEventType, setSelectedEventType] = useState<EventType>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot>();
  const [loadingEventTypes, setLoadingEventTypes] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [bookingOpened, setBookingOpened] = useState(false);

  const activeStep = selectedSlot ? 2 : selectedEventType ? 1 : 0;

  const loadEventTypes = async () => {
    setLoadingEventTypes(true);
    setError(undefined);
    try {
      const [eventTypesResult, ownerResult] = await Promise.allSettled([
        api.listEventTypes(),
        api.getOwner(),
      ]);

      if (eventTypesResult.status === 'rejected') {
        throw eventTypesResult.reason;
      }

      setEventTypes(eventTypesResult.value);

      if (ownerResult.status === 'fulfilled') {
        setOwner(ownerResult.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки типов событий');
    } finally {
      setLoadingEventTypes(false);
    }
  };

  const loadSlots = async (eventType: EventType) => {
    setLoadingSlots(true);
    setSelectedSlot(undefined);
    try {
      setSlots(await api.listSlots(eventType.id));
    } catch (err) {
      notifications.show({ color: 'red', title: 'Слоты не загружены', message: err instanceof Error ? err.message : 'Повторите позже' });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    void loadEventTypes();
  }, []);

  const handleSelectEventType = (eventType: EventType) => {
    setSelectedEventType(eventType);
    void loadSlots(eventType);
  };

  const ownerName = owner?.name || 'Владелец календаря';

  const handleSubmitBooking = async (values: { guestName: string; guestContact: string }) => {
    if (!selectedEventType || !selectedSlot) {
      return;
    }

    setSubmitting(true);
    try {
      await api.createBooking({
        eventTypeId: selectedEventType.id,
        startAt: selectedSlot.startAt,
        guestName: values.guestName.trim(),
        guestContact: values.guestContact.trim(),
      });
      notifications.show({ color: 'green', title: 'Бронирование создано', message: 'Встреча подтверждена.' });
      setBookingOpened(false);
      await loadSlots(selectedEventType);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать бронирование';
      notifications.show({ color: 'red', title: err instanceof ApiError && err.code === 'slot_unavailable' ? 'Слот уже занят' : 'Ошибка бронирования', message });
      await loadSlots(selectedEventType);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack gap="xl">
      <section className="booking-hero">
        <Stack gap="xl" className="hero-copy">
          <Stack gap="md">
            <Badge className="hero-kicker" variant="white">Быстрая запись на встречу</Badge>
            <Title order={1}>CalKing</Title>
            <Text className="hero-text">Забронируйте встречу за минуту: выберите тип события, удобный слот и оставьте контакты для подтверждения.</Text>
          </Stack>
          <Group gap="sm">
            <Button size="md" className="hero-action" onClick={() => document.getElementById('event-types')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Записаться</Button>
            <Text size="sm" c="dimmed">3 шага до подтверждения</Text>
          </Group>
        </Stack>

        <Card withBorder className="hero-feature-card">
          <Stack gap="md">
            <Title order={2}>Возможности</Title>
            <Stack gap="sm" className="feature-list">
              <Text>Выбор типа события и удобного времени для встречи.</Text>
              <Text>Быстрое бронирование с подтверждением и контактами гостя.</Text>
              <Text>Управление типами встреч и просмотр предстоящих записей в админке.</Text>
            </Stack>
          </Stack>
        </Card>
      </section>

      <div className="progress-steps" aria-label="Шаги бронирования">
        {['Тип события', 'Свободный слот', 'Данные гостя'].map((label, index) => (
          <div key={label} className={index <= activeStep ? 'progress-step progress-step-active' : 'progress-step'}>
            <ThemeIcon size="sm" radius="xl" variant={index <= activeStep ? 'filled' : 'light'}>{index + 1}</ThemeIcon>
            <Text size="sm" fw={700}>{label}</Text>
          </div>
        ))}
      </div>

      {loadingEventTypes ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={loadEventTypes} /> : null}

      {!loadingEventTypes && !error && eventTypes.length === 0 ? (
        <EmptyState title="Типы событий не найдены" message="Владелец еще не настроил события для публичной записи." />
      ) : null}

      {eventTypes.length > 0 ? (
        <Stack gap="lg" id="event-types" className="event-section">
          <Card withBorder className="event-intro-card">
            <Group gap="md" align="center" wrap="nowrap">
              <div className="host-avatar" aria-hidden="true" />
              <div>
                <Text fw={800}>{ownerName}</Text>
                <Text size="sm" c="dimmed">Владелец календаря</Text>
              </div>
            </Group>
            <Stack gap="xs" mt="lg">
              <Title order={2}>Выберите тип события</Title>
              <Text c="dimmed">Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот.</Text>
            </Stack>
          </Card>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {eventTypes.map((eventType) => (
              <EventTypeCard key={eventType.id} eventType={eventType} active={eventType.id === selectedEventType?.id} onSelect={handleSelectEventType} />
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}

      {selectedEventType ? (
        <section className="slot-section">
          <Group justify="space-between" align="flex-end" mb="lg">
            <div>
              <Title order={2}>{selectedEventType.title}</Title>
              <Text c="dimmed">Выберите свободное время для бронирования. Занятые слоты показаны, но недоступны для выбора.</Text>
            </div>
            <Button variant="light" onClick={() => void loadSlots(selectedEventType)} loading={loadingSlots}>Обновить</Button>
          </Group>
          {loadingSlots ? <LoadingState label="Загружаем слоты" /> : <SlotPicker eventType={selectedEventType} ownerName={ownerName} slots={slots} selectedStartAt={selectedSlot?.startAt} onSelect={(slot) => { setSelectedSlot(slot); setBookingOpened(true); }} />}
        </section>
      ) : null}

      <Modal opened={bookingOpened} onClose={() => setBookingOpened(false)} title="Подтвердить бронирование" centered>
        {selectedEventType && selectedSlot ? (
          <BookingForm eventType={selectedEventType} slot={selectedSlot} loading={submitting} onSubmit={handleSubmitBooking} />
        ) : null}
      </Modal>
    </Stack>
  );
}
