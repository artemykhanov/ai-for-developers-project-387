import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core';
import type { EventType } from '../api/types';

interface EventTypeCardProps {
  eventType: EventType;
  active?: boolean;
  onSelect: (eventType: EventType) => void;
}

export default function EventTypeCard({ eventType, active = false, onSelect }: EventTypeCardProps) {
  return (
    <Card
      withBorder
      shadow={active ? 'md' : 'xs'}
      className={active ? 'event-type-card event-type-card-active' : 'event-type-card'}
      h="100%"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(eventType)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(eventType);
        }
      }}
    >
      <Stack gap="lg" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Title order={3}>{eventType.title}</Title>
          <Badge variant="light" className="duration-badge">{eventType.durationMinutes} мин</Badge>
        </Group>
        <Text c="dimmed">{eventType.description}</Text>
        <Text size="sm" fw={800} className="event-card-action">{active ? 'Календарь открыт' : 'Выбрать слот'}</Text>
      </Stack>
    </Card>
  );
}
