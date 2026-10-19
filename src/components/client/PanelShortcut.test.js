import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import PanelShortcut from './PanelShortcut';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockNavigate = jest.fn();

beforeEach(() => {
  mockNavigate.mockClear();
  useNavigate.mockReturnValue(mockNavigate);
});

describe('PanelShortcut', () => {
  test('sin sesión no renderiza nada', () => {
    useAuth.mockReturnValue({ currentUser: null, userRoles: [] });
    const { container } = render(<PanelShortcut />);
    expect(container).toBeEmptyDOMElement();
  });

  test('con sesión admin muestra el botón y navega a /admin', () => {
    useAuth.mockReturnValue({
      currentUser: { uid: 'u1', email: 'admin@distritowok.com' },
      userRoles: ['admin']
    });
    render(<PanelShortcut />);

    const button = screen.getByRole('button', { name: 'Ir a mi panel' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('con varios roles aplica la prioridad del login aunque el array venga en otro orden', () => {
    useAuth.mockReturnValue({
      currentUser: { uid: 'u2' },
      userRoles: ['delivery', 'admin']
    });
    render(<PanelShortcut />);

    fireEvent.click(screen.getByRole('button', { name: 'Ir a mi panel' }));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('rol sin panel conocido no renderiza el botón', () => {
    useAuth.mockReturnValue({
      currentUser: { uid: 'u3' },
      userRoles: ['invitado']
    });
    const { container } = render(<PanelShortcut />);
    expect(container).toBeEmptyDOMElement();
  });
});
