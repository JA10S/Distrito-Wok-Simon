// Polyfill for TextEncoder/TextDecoder in Jest
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Matchers extendidos (toBeInTheDocument, etc.)
import '@testing-library/jest-dom';
