import { registerServiceWorker } from './pwa';

let mockRegister;
let mockGetRegistrations;
let mockUnregister;

beforeEach(() => {
  mockRegister = jest.fn().mockResolvedValue({ scope: '/' });
  mockUnregister = jest.fn().mockResolvedValue(true);
  mockGetRegistrations = jest.fn().mockResolvedValue([
    { unregister: mockUnregister },
    { unregister: mockUnregister }
  ]);
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { register: mockRegister, getRegistrations: mockGetRegistrations },
    configurable: true
  });
});

afterAll(() => {
  delete navigator.serviceWorker;
});

describe('registerServiceWorker', () => {
  test('en producción registra /sw.js', async () => {
    const result = await registerServiceWorker({ isProd: true });
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    expect(result).toEqual({ scope: '/' });
  });

  test('en desarrollo desregistra cualquier SW previo', async () => {
    const result = await registerServiceWorker({ isProd: false });
    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockGetRegistrations).toHaveBeenCalledTimes(1);
    expect(mockUnregister).toHaveBeenCalledTimes(2);
    expect(result).toBeNull();
  });

  test('sin soporte de serviceWorker devuelve null sin lanzar', async () => {
    const original = navigator.serviceWorker;
    delete navigator.serviceWorker;
    const result = await registerServiceWorker({ isProd: true });
    expect(result).toBeNull();
    expect(mockRegister).not.toHaveBeenCalled();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: original,
      configurable: true
    });
  });

  test('si el registro falla devuelve null (no rompe la app)', async () => {
    mockRegister.mockRejectedValue(new Error('sw no permitido'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await registerServiceWorker({ isProd: true });
    expect(result).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
