import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import dayjs from 'dayjs';
import type { EventType, Slot } from '../api/types';

interface BookingFormProps {
  eventType: EventType;
  slot: Slot;
  loading: boolean;
  onSubmit: (values: { guestName: string; guestContact: string }) => void;
}

export default function BookingForm({ eventType, slot, loading, onSubmit }: BookingFormProps) {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      guestName: '',
      guestContact: '',
    },
    validate: {
      guestName: (value) => (value.trim().length < 2 ? 'Введите имя' : null),
      guestContact: (value) => (value.trim().length < 3 ? 'Введите email или телефон' : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <Text fw={600}>{eventType.title}</Text>
        <Text c="dimmed" size="sm">
          {dayjs(slot.startAt).format('D MMMM YYYY, HH:mm')} - {dayjs(slot.endAt).format('HH:mm')}
        </Text>
        <TextInput
          label="Имя"
          placeholder="Как к вам обращаться"
          withAsterisk
          key={form.key('guestName')}
          {...form.getInputProps('guestName')}
        />
        <TextInput
          label="Контакт"
          placeholder="Email или телефон"
          withAsterisk
          key={form.key('guestContact')}
          {...form.getInputProps('guestContact')}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={loading}>Забронировать</Button>
        </Group>
      </Stack>
    </form>
  );
}
