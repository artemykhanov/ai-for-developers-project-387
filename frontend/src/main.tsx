import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './styles/app.css';
import 'dayjs/locale/ru';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, MantineProvider, type MantineColorsTuple } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import App from './App';

const calendarColor: MantineColorsTuple = [
  '#f0efff',
  '#dfddf4',
  '#bcb8e3',
  '#9791d2',
  '#7971c4',
  '#665ebc',
  '#5c54b8',
  '#4c459f',
  '#433d8f',
  '#37327f',
];

const theme = createTheme({
  colors: {
    calendar: calendarColor,
  },
  primaryColor: 'calendar',
  defaultRadius: 'md',
  fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found');
}

createRoot(root).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 1, weekendDays: [0, 6], consistentWeeks: true }}>
        <Notifications position="top-right" limit={4} />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
