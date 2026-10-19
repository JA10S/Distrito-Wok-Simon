import {
  isWakeLockSupported,
  requestWakeLock,
  releaseWakeLock
} from './wakeLock';

let mockLock;
let mockRequest;

beforeEach(() => {
  mockLock = {
    release: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn()
  };
  mockRequest = jest.fn().mockResolvedValue(mockLock);
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request: mockRequest },
    configurable: true
  });
});

afterEach(async () => {
  await releaseWakeLock();
});

afterAll(() => {
  delete navigator.wakeLock;
});

const releaseHandler = () =>
  mockLock.addEventListener.mock.calls.find((c) => c[0] === 'release')[1];

describe('wakeLock', () => {
  test('soportado cuando navigator.wakeLock existe', () => {
    expect(isWakeLockSupported()).toBe(true);
  });

  test('sin soporte devuelve false sin lanzar', async () => {
    delete navigator.wakeLock;
    expect(isWakeLockSupported()).toBe(false);
    await expect(requestWakeLock()).resolves.toBe(false);
  });

  test('requestWakeLock pide el lock de pantalla y lo libera con releaseWakeLock', async () => {
    await expect(requestWakeLock()).resolves.toBe(true);
    expect(mockRequest).toHaveBeenCalledWith('screen');

    await releaseWakeLock();
    expect(mockLock.release).toHaveBeenCalledTimes(1);
  });

  test('si el navegador rechaza el lock devuelve false', async () => {
    mockRequest.mockRejectedValue(new Error('denegado'));
    await expect(requestWakeLock()).resolves.toBe(false);
  });

  test('al volver a primer plano con lock liberado lo vuelve a pedir', async () => {
    await requestWakeLock();
    expect(mockRequest).toHaveBeenCalledTimes(1);

    // El navegador libera el lock (pantalla pasó a segundo plano)
    releaseHandler()();

    mockRequest.mockResolvedValue(mockLock);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
