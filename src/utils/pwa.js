/**
 * Registro del Service Worker de la PWA.
 * - Producción: registra /sw.js.
 * - Desarrollo: desregistra cualquier SW previo para no interferir con HMR.
 */
export function registerServiceWorker({
  isProd = process.env.NODE_ENV === 'production',
  swUrl = '/sw.js'
} = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  if (!isProd) {
    return navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
        return null;
      })
      .catch(() => null);
  }

  return navigator.serviceWorker
    .register(swUrl)
    .then((registration) => registration)
    .catch((err) => {
      console.error('Error registrando el service worker:', err);
      return null;
    });
}
