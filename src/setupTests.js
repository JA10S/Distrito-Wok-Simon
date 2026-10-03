// Polyfill for TextEncoder/TextDecoder in Jest
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Matchers extendidos (toBeInTheDocument, etc.)
import '@testing-library/jest-dom';

// matchMedia no existe en jsdom: necesario para el modo "Sistema"
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

