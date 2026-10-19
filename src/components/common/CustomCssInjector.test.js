const mockOnSnapshot = jest.fn();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  onSnapshot: (...args) => mockOnSnapshot(...args)
}));

jest.mock('../../services/firebase', () => ({
  __esModule: true,
  app: {},
  default: {}
}));

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import CustomCssInjector, { CUSTOM_CSS_STYLE_ID } from './CustomCssInjector';

beforeEach(() => {
  mockOnSnapshot.mockReset();
  const existing = document.getElementById(CUSTOM_CSS_STYLE_ID);
  if (existing) existing.remove();
});

function captureSnapshot() {
  let callback;
  let errorCallback;
  mockOnSnapshot.mockImplementation((ref, next, error) => {
    callback = next;
    errorCallback = error;
    return () => {};
  });
  return {
    emit: (data) =>
      act(() => {
        callback({
          exists: () => Boolean(data),
          data: () => data
        });
      }),
    emitError: () =>
      act(() => {
        errorCallback(new Error('denied'));
      })
  };
}

test('inyecta el CSS guardado en un <style> del head', async () => {
  const bus = captureSnapshot();

  render(<CustomCssInjector />);
  bus.emit({ css: 'body { outline: 1px solid red; }' });

  await waitFor(() => {
    const el = document.getElementById(CUSTOM_CSS_STYLE_ID);
    expect(el).not.toBeNull();
    expect(el.textContent).toBe('body { outline: 1px solid red; }');
  });
});

test('sin documento guardado no crea el style', async () => {
  const bus = captureSnapshot();

  render(<CustomCssInjector />);
  bus.emit(null);

  await waitFor(() => {
    expect(mockOnSnapshot).toHaveBeenCalled();
  });
  expect(document.getElementById(CUSTOM_CSS_STYLE_ID)).toBeNull();
});

test('error de lectura no deja CSS y no rompe', async () => {
  const bus = captureSnapshot();

  render(<CustomCssInjector />);
  bus.emit({ css: '.x { color: red; }' });
  bus.emitError();

  await waitFor(() => {
    expect(document.getElementById(CUSTOM_CSS_STYLE_ID)).toBeNull();
  });
});

test('al desmontar elimina el style inyectado', async () => {
  const bus = captureSnapshot();

  const { unmount } = render(<CustomCssInjector />);
  bus.emit({ css: '.y { color: blue; }' });

  await waitFor(() => {
    expect(document.getElementById(CUSTOM_CSS_STYLE_ID)).not.toBeNull();
  });

  unmount();
  expect(document.getElementById(CUSTOM_CSS_STYLE_ID)).toBeNull();
});
