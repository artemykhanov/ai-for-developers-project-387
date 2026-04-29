import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';

export function LoadingState({ label = 'Загружаем данные' }: { label?: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <Loader />
        <Text c="dimmed">{label}</Text>
      </Stack>
    </Center>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert color="red" title="Не удалось выполнить запрос" variant="light">
      <Stack gap="sm">
        <Text size="sm">{message}</Text>
        {onRetry ? <Button variant="light" color="red" onClick={onRetry}>Повторить</Button> : null}
      </Stack>
    </Alert>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Alert color="gray" title={title} variant="light">
      {message}
    </Alert>
  );
}
