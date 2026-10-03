jest.mock('../services/firebase', () => ({ app: {}, default: {} }));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({ path: 'settings/theme' })),
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(() => Promise.resolve())
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

function Probe() {
  const { resolvedMode, isLight, toggleMode } = useTheme();
  return (
    <div>
      <button onClick={toggleMode}>modo:{resolvedMode}</button>
      <span data-testid="is-light">{String(isLight)}</span>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-mode');
});

test('toggleMode alterna el modo y lo escribe en el documento', () => {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );

  const surface = () => document.documentElement.style.getPropertyValue('--color-surface').trim();

  expect(screen.getByText('modo:dark')).toBeInTheDocument();
  expect(document.documentElement.dataset.mode).toBe('dark');
  expect(surface()).toBe('13 13 13');

  fireEvent.click(screen.getByText('modo:dark'));

  expect(screen.getByText('modo:light')).toBeInTheDocument();
  expect(screen.getByTestId('is-light')).toHaveTextContent('true');
  expect(document.documentElement.dataset.mode).toBe('light');
  expect(surface()).toBe('250 246 236');
  expect(window.localStorage.getItem('dw-mode')).toBe('light');

  fireEvent.click(screen.getByText('modo:light'));

  expect(screen.getByText('modo:dark')).toBeInTheDocument();
  expect(document.documentElement.dataset.mode).toBe('dark');
  expect(surface()).toBe('13 13 13');
  expect(window.localStorage.getItem('dw-mode')).toBe('dark');
});

test('la preferencia guardada en el navegador tiene prioridad', () => {
  window.localStorage.setItem('dw-mode', 'light');

  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  );

  expect(screen.getByText('modo:light')).toBeInTheDocument();
  expect(document.documentElement.dataset.mode).toBe('light');
});
