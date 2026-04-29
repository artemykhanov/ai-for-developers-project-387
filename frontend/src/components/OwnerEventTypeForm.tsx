import { Button, Group, NumberInput, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { CreateEventTypeRequest, EventType } from '../api/types';

interface OwnerEventTypeFormProps {
  eventType?: EventType;
  loading: boolean;
  onCancel?: () => void;
  onSubmit: (values: CreateEventTypeRequest) => void;
}

export default function OwnerEventTypeForm({ eventType, loading, onCancel, onSubmit }: OwnerEventTypeFormProps) {
  const form = useForm<CreateEventTypeRequest>({
    mode: 'uncontrolled',
    initialValues: {
      title: eventType?.title || '',
      description: eventType?.description || '',
      durationMinutes: eventType?.durationMinutes || 30,
    },
    validate: {
      title: (value) => (value.trim().length < 2 ? 'Введите название' : null),
      description: (value) => (value.trim().length < 5 ? 'Введите описание' : null),
      durationMinutes: (value) => (value < 5 ? 'Минимальная длительность 5 минут' : null),
    },
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <TextInput label="Название" withAsterisk key={form.key('title')} {...form.getInputProps('title')} />
        <Textarea label="Описание" autosize minRows={3} withAsterisk key={form.key('description')} {...form.getInputProps('description')} />
        <NumberInput
          label="Длительность, минут"
          min={5}
          step={5}
          withAsterisk
          key={form.key('durationMinutes')}
          {...form.getInputProps('durationMinutes')}
        />
        <Group justify="flex-end">
          {onCancel ? <Button variant="default" onClick={onCancel}>Отмена</Button> : null}
          <Button type="submit" loading={loading}>{eventType ? 'Сохранить' : 'Создать'}</Button>
        </Group>
      </Stack>
    </form>
  );
}
