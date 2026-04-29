import { Badge, Button, Card, Group, Modal, SimpleGrid, Stack, Table, Tabs, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Booking, CalendarOwner, CreateEventTypeRequest, EventType } from '../api/types';
import OwnerEventTypeForm from '../components/OwnerEventTypeForm';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';

function formatDateTime(value: string) {
  return dayjs(value).format('D MMM YYYY, HH:mm');
}

export default function OwnerDashboardPage() {
  const [owner, setOwner] = useState<CalendarOwner>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [editingEventType, setEditingEventType] = useState<EventType>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [formOpened, formHandlers] = useDisclosure(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [ownerResult, bookingsResult, eventTypesResult] = await Promise.all([
        api.getOwner(),
        api.listOwnerBookings(),
        api.listOwnerEventTypes(),
      ]);
      setOwner(ownerResult);
      setBookings(bookingsResult);
      setEventTypes(eventTypesResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки кабинета владельца');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const openCreateForm = () => {
    setEditingEventType(undefined);
    formHandlers.open();
  };

  const openEditForm = (eventType: EventType) => {
    setEditingEventType(eventType);
    formHandlers.open();
  };

  const closeForm = () => {
    formHandlers.close();
    setEditingEventType(undefined);
  };

  const handleSaveEventType = async (values: CreateEventTypeRequest) => {
    setSaving(true);
    try {
      if (editingEventType) {
        await api.updateEventType(editingEventType.id, values);
        notifications.show({ color: 'green', title: 'Тип события обновлен', message: 'Изменения сохранены.' });
      } else {
        await api.createEventType(values);
        notifications.show({ color: 'green', title: 'Тип события создан', message: 'Новый тип события доступен гостям.' });
      }
      closeForm();
      await loadDashboard();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Не удалось сохранить', message: err instanceof Error ? err.message : 'Повторите позже' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEventType = async (eventType: EventType) => {
    if (!window.confirm(`Удалить тип события "${eventType.title}"?`)) {
      return;
    }

    try {
      await api.deleteEventType(eventType.id);
      notifications.show({ color: 'green', title: 'Тип события удален', message: 'Список обновлен.' });
      await loadDashboard();
    } catch (err) {
      notifications.show({ color: 'red', title: 'Не удалось удалить', message: err instanceof Error ? err.message : 'Повторите позже' });
    }
  };

  if (loading) {
    return <LoadingState label="Загружаем кабинет владельца" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Card withBorder className="owner-card">
          <Text size="sm" c="dimmed">Владелец календаря</Text>
          <Title order={2}>{owner?.name || 'Неизвестный владелец'}</Title>
          <Badge mt="sm" variant="light">{owner?.timezone || 'timezone unknown'}</Badge>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">Предстоящие бронирования</Text>
          <Title order={2}>{bookings.length}</Title>
        </Card>
        <Card withBorder>
          <Text size="sm" c="dimmed">Типы событий</Text>
          <Title order={2}>{eventTypes.length}</Title>
        </Card>
      </SimpleGrid>

      <Tabs defaultValue="bookings" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="bookings">Бронирования</Tabs.Tab>
          <Tabs.Tab value="event-types">Типы событий</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="bookings" pt="lg">
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={2}>Все предстоящие бронирования</Title>
                <Text c="dimmed">Все ближайшие записи гостей собраны в одном списке.</Text>
              </div>
              <Button variant="light" onClick={() => void loadDashboard()}>Обновить</Button>
            </Group>

            {bookings.length === 0 ? (
              <EmptyState title="Бронирований нет" message="Когда гости создадут записи, они появятся в этом списке." />
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Гость</Table.Th>
                      <Table.Th>Контакт</Table.Th>
                      <Table.Th>Тип события</Table.Th>
                      <Table.Th>Начало</Table.Th>
                      <Table.Th>Окончание</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {bookings.map((booking) => (
                      <Table.Tr key={booking.id}>
                        <Table.Td>{booking.guestName}</Table.Td>
                        <Table.Td>{booking.guestContact}</Table.Td>
                        <Table.Td>{eventTypes.find((eventType) => eventType.id === booking.eventTypeId)?.title || booking.eventTypeId}</Table.Td>
                        <Table.Td>{formatDateTime(booking.startAt)}</Table.Td>
                        <Table.Td>{formatDateTime(booking.endAt)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="event-types" pt="lg">
          <Card withBorder>
            <Group justify="space-between" mb="md" align="flex-start">
              <div>
                <Title order={2}>Управление типами событий</Title>
                <Text c="dimmed">Настройте встречи, которые гости смогут выбрать при записи.</Text>
              </div>
              <Button onClick={openCreateForm}>Создать тип</Button>
            </Group>

            {eventTypes.length === 0 ? (
              <EmptyState title="Типы событий не созданы" message="Создайте первый тип события, чтобы гости могли бронировать встречи." />
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }}>
                {eventTypes.map((eventType) => (
                  <Card key={eventType.id} withBorder shadow="xs">
                    <Stack>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Title order={3}>{eventType.title}</Title>
                          <Text c="dimmed" mt={4}>{eventType.description}</Text>
                        </div>
                        <Badge variant="light">{eventType.durationMinutes} мин</Badge>
                      </Group>
                      <Group justify="flex-end">
                        <Button variant="default" onClick={() => openEditForm(eventType)}>Редактировать</Button>
                        <Button color="red" variant="light" onClick={() => void handleDeleteEventType(eventType)}>Удалить</Button>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Card>
        </Tabs.Panel>
      </Tabs>

      <Modal opened={formOpened} onClose={closeForm} title={editingEventType ? 'Редактировать тип события' : 'Создать тип события'} centered>
        <OwnerEventTypeForm eventType={editingEventType} loading={saving} onCancel={closeForm} onSubmit={handleSaveEventType} />
      </Modal>
    </Stack>
  );
}
