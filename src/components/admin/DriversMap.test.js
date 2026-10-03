const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('react-leaflet', () => {
  const react = require('react');
  return {
    MapContainer: (props) =>
      react.createElement('div', { 'data-testid': 'map' }, props.children),
    TileLayer: () => null,
    Marker: (props) => react.createElement('div', null, props.children),
    Popup: () => null,
    useMap: () => ({ setView: () => {}, fitBounds: () => {} }),
  };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import DriversMap from './DriversMap';

const onlineDriver = {
  id: 'u1',
  driverName: 'Pedro Gómez',
  driverEmail: 'domicilio@distritowok.com',
  lat: 4.65,
  lng: -74.05,
  accuracy: 12,
  sharing: true,
  updatedAt: { toDate: () => new Date(Date.now() - 60000) },
};

test('muestra el estado vacío cuando nadie ha compartido ubicación', () => {
  render(<DriversMap drivers={[]} deliveries={[]} />);

  expect(
    screen.getByText('Ningún repartidor ha compartido su ubicación')
  ).toBeInTheDocument();
  expect(screen.queryByTestId('map')).not.toBeInTheDocument();
});

test('lista al repartidor en línea con precisión y enlace a Google Maps', () => {
  render(<DriversMap drivers={[onlineDriver]} deliveries={[]} />);

  expect(screen.getByTestId('map')).toBeInTheDocument();
  expect(screen.getByText('Pedro Gómez')).toBeInTheDocument();
  expect(screen.getByText('En línea')).toBeInTheDocument();
  expect(screen.getByText(/Última señal: hace 1 min/)).toBeInTheDocument();
  expect(screen.getByText(/±12 m/)).toBeInTheDocument();

  expect(screen.getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps?q=4.65,-74.05'
  );
  expect(screen.getByRole('button', { name: 'Centrar en Pedro Gómez' })).toBeInTheDocument();
});

test('marca "Sin señal" a quien lleva rato sin actualizar', () => {
  const staleDriver = {
    ...onlineDriver,
    updatedAt: { toDate: () => new Date(Date.now() - 10 * 60000) },
  };

  render(<DriversMap drivers={[staleDriver]} deliveries={[]} />);

  expect(screen.getByText('Sin señal')).toBeInTheDocument();
  expect(screen.getByText(/Última señal: hace 10 min/)).toBeInTheDocument();
});

test('muestra "Compartir apagado" sin botón de centrar', () => {
  const offlineDriver = { ...onlineDriver, sharing: false };

  render(<DriversMap drivers={[offlineDriver]} deliveries={[]} />);

  expect(screen.getByText('Compartir apagado')).toBeInTheDocument();
  expect(
    screen.getByText('Nadie está compartiendo su ubicación en este momento.')
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Centrar/ })).not.toBeInTheDocument();
  expect(screen.queryByTestId('map')).not.toBeInTheDocument();
});

test('muestra la entrega activa del repartidor', () => {
  const deliveries = [
    {
      id: 'd1',
      orderId: 'order-987654',
      status: 'delivering',
      assignedTo: 'u1',
    },
  ];

  render(<DriversMap drivers={[onlineDriver]} deliveries={deliveries} />);

  expect(screen.getByText(/Pedido #987654/)).toBeInTheDocument();
});
