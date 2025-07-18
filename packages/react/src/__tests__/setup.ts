import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any; 