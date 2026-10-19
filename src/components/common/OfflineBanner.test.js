import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';

describe('OfflineBanner', () => {
  test('con conexión no muestra nada', () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('al perder la conexión muestra el aviso', () => {
    render(<OfflineBanner />);
    fireEvent(window, new Event('offline'));
    expect(screen.getByRole('alert')).toHaveTextContent(/Sin conexión/);
  });

  test('al volver la conexión oculta el aviso', () => {
    render(<OfflineBanner />);
    fireEvent(window, new Event('offline'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent(window, new Event('online'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
