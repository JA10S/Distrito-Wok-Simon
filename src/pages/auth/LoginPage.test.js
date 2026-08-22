const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    userRoles: [],
    currentUser: null,
  }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByText(/Iniciar Sesión/)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/usuario@restaurante.com/)).toBeInTheDocument();
  expect(screen.getByText(/Contraseña/)).toBeInTheDocument();
});
