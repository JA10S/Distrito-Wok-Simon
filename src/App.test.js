// Polyfill for TextEncoder/TextDecoder in Jest
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock de Firebase antes de cualquier importación
jest.mock('./services/firebase', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  setDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn()
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import App from './App';

beforeEach(() => {
  onSnapshot.mockReturnValue(() => {});
});

test('renders without crashing', () => {
  render(<App />);
});