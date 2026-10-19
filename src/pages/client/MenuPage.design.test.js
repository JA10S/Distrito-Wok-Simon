const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const mockBlocks = [];

jest.mock('../../hooks/useMenu', () => ({
  useMenu: () => ({
    loading: false,
    error: null,
    menu: {
      arroces: [
        { id: 'a1', name: 'Arroz Costeño Wok', price: '30K', available: true }
      ],
      corrientes: [],
      porciones: [],
      bebidas: [
        { id: 'b1', name: 'Gaseosa', price: '5K', available: true }
      ]
    }
  })
}));

jest.mock('../../hooks/useMenuLayout', () => ({
  useMenuLayout: () => ({
    layout: { blocks: mockBlocks },
    loading: false,
    saveLayout: jest.fn(() => Promise.resolve({ success: true })),
    resetLayout: jest.fn(() => Promise.resolve({ success: true }))
  })
}));

jest.mock('../../services/orderService', () => ({
  createTakeawayOrder: jest.fn(),
  watchOrder: jest.fn(() => () => {})
}));

jest.mock('../../services/callService', () => ({
  createCall: jest.fn()
}));

jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: { layout: 'clasic' },
    resolvedMode: 'dark',
    isLight: false,
    setLocalMode: () => {},
    toggleMode: () => {}
  })
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: null, userRoles: [] })
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import MenuPage from './MenuPage';
import { DEFAULT_BLOCKS } from '../../utils/layoutUtils';

const blocksWith = (overrides) =>
  DEFAULT_BLOCKS.map((block) => {
    const override = overrides.find((o) => o.id === block.id);
    return override ? { ...block, ...override } : { ...block };
  });

beforeEach(() => {
  mockBlocks.length = 0;
});

test('respeta el orden, los textos personalizados y oculta los bloques marcados', () => {
  mockBlocks.push(
    ...blocksWith([
      { id: 'porciones', title: 'Porciones Especiales' },
      { id: 'corrientes', visible: false },
      { id: 'footer', visible: false }
    ])
  );
  // Reordenar: porciones primero (por delante de arroces)
  const porciones = mockBlocks.find((b) => b.id === 'porciones');
  mockBlocks.splice(mockBlocks.indexOf(porciones), 1);
  mockBlocks.unshift(porciones);

  render(<MenuPage />);

  const titles = screen
    .queryAllByRole('heading', { level: 2 })
    .map((el) => el.textContent);

  expect(titles[0]).toBe('Porciones Especiales');
  expect(titles[1]).toBe('🍚 Nuestros Arroces');
  expect(screen.queryByText('🍖 Corrientes')).not.toBeInTheDocument();
  expect(screen.queryByText('Contáctanos')).not.toBeInTheDocument();
});

test('oculta la portada cuando el bloque hero está oculto', () => {
  mockBlocks.push(...blocksWith([{ id: 'hero', visible: false }]));

  render(<MenuPage />);

  expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  expect(screen.queryByText(/Sabor que enamora/)).not.toBeInTheDocument();
  // el menú sigue visible
  expect(screen.getByText(/Nuestros Arroces/)).toBeInTheDocument();
  expect(screen.getByText('Contáctanos')).toBeInTheDocument();
});

test('aplica columns: 1 a la sección (una sola columna en cualquier layout)', () => {
  mockBlocks.push(...blocksWith([{ id: 'arroces', columns: '1' }]));

  render(<MenuPage />);

  const heading = screen.getByRole('heading', { name: /Nuestros Arroces/, level: 2 });
  const sectionGrid = heading.closest('section').querySelector('.grid');

  expect(sectionGrid).toHaveClass('grid-cols-1');
  expect(sectionGrid).not.toHaveClass('sm:grid-cols-2');
});

test('aplica columns: 3 con lg:grid-cols-3 en la sección', () => {
  mockBlocks.push(...blocksWith([{ id: 'arroces', columns: '3' }]));

  render(<MenuPage />);

  const heading = screen.getByRole('heading', { name: /Nuestros Arroces/, level: 2 });
  const sectionGrid = heading.closest('section').querySelector('.grid');

  expect(sectionGrid).toHaveClass('sm:grid-cols-2');
  expect(sectionGrid).toHaveClass('lg:grid-cols-3');
});
