import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { EventType, Slot } from '../api/types';
import { EmptyState } from './StatusViews';

interface SlotPickerProps {
  eventType: EventType;
  ownerName: string;
  slots: Slot[];
  selectedStartAt?: string;
  onSelect: (slot: Slot) => void;
}

function formatDate(value: string) {
  return dayjs(value).format('D MMMM, dddd');
}

function formatTimeRange(slot: Slot) {
  return `${dayjs(slot.startAt).format('HH:mm')} - ${dayjs(slot.endAt).format('HH:mm')}`;
}

export default function SlotPicker({ eventType, ownerName, slots, selectedStartAt, onSelect }: SlotPickerProps) {
  const groups = useMemo(() => slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = dayjs(slot.startAt).format('YYYY-MM-DD');
    acc[key] = [...(acc[key] || []), slot];
    return acc;
  }, {}), [slots]);
  const dates = Object.keys(groups);
  const [selectedDate, setSelectedDate] = useState(() => selectedStartAt ? dayjs(selectedStartAt).format('YYYY-MM-DD') : dates[0]);
  const currentDate = selectedDate && groups[selectedDate] ? selectedDate : dates[0];
  const dateSlots = currentDate ? groups[currentDate] : [];
  const selectedSlot = slots.find((slot) => slot.isAvailable && slot.startAt === selectedStartAt);

  if (slots.length === 0) {
    return <EmptyState title="Нет слотов" message="Выберите другой тип события или повторите позже." />;
  }

  return (
    <div className="slot-layout">
      <Card withBorder className="slot-side-card">
        <Stack gap="lg">
          <Group gap="md" wrap="nowrap">
            <div className="host-avatar" aria-hidden="true" />
            <div>
              <Text fw={800}>{ownerName}</Text>
              <Text size="sm" c="dimmed">Владелец календаря</Text>
            </div>
          </Group>
          <Stack gap="xs">
            <Title order={3}>{eventType.title}</Title>
            <Text>{eventType.description}</Text>
          </Stack>
          <div className="slot-summary-box">
            <Text c="dimmed">Выбранная дата</Text>
            <Text fw={800}>{currentDate ? formatDate(groups[currentDate][0].startAt) : 'Дата не выбрана'}</Text>
          </div>
          <div className="slot-summary-box">
            <Text c="dimmed">Выбранное время</Text>
            <Text fw={800}>{selectedSlot ? formatTimeRange(selectedSlot) : 'Время не выбрано'}</Text>
          </div>
        </Stack>
      </Card>

      <Card withBorder className="slot-calendar-card">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <div>
              <Title order={3}>Календарь</Title>
              <Text size="sm" c="dimmed">Ближайшие даты со всеми слотами</Text>
            </div>
            <Badge variant="light">{dates.length} дней</Badge>
          </Group>
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="xs">
            {dates.map((date) => {
              const firstSlot = groups[date][0];
              const availableCount = groups[date].filter((slot) => slot.isAvailable).length;
              const busyCount = groups[date].length - availableCount;
              const active = date === currentDate;

              return (
                <button
                  type="button"
                  key={date}
                  className={active ? 'date-tile date-tile-active' : 'date-tile'}
                  onClick={() => setSelectedDate(date)}
                >
                  <span>{dayjs(firstSlot.startAt).format('dd')}</span>
                  <strong>{dayjs(firstSlot.startAt).format('D')}</strong>
                  <small>{availableCount} св. / {busyCount} зан.</small>
                </button>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder className="slot-times-card">
        <Stack gap="lg">
          <div>
            <Title order={3}>Статус слотов</Title>
            <Text size="sm" c="dimmed">{currentDate ? formatDate(groups[currentDate][0].startAt) : null}</Text>
          </div>
          <Stack gap="xs" className="time-slots-list">
            {dateSlots.map((slot) => {
              const selected = slot.isAvailable && slot.startAt === selectedStartAt;

              return (
                <Button
                  key={slot.startAt}
                  variant={selected ? 'filled' : 'default'}
                  className={slot.isAvailable ? 'time-slot-button' : 'time-slot-button time-slot-button-busy'}
                  onClick={() => onSelect(slot)}
                  disabled={!slot.isAvailable}
                  fullWidth
                  justify="space-between"
                >
                  <span>{formatTimeRange(slot)}</span>
                  <span>{slot.isAvailable ? 'Свободно' : 'Занято'}</span>
                </Button>
              );
            })}
          </Stack>
        </Stack>
      </Card>
    </div>
  );
}
