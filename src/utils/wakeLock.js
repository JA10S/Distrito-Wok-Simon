/**
 * Wake Lock (API de bloqueo de pantalla) para mantener encendido el
 * dispositivo mientras el domiciliario comparte su ubicación.
 * - Sin soporte (iOS/Safari) → devuelve false sin lanzar.
 * - La API libera sola el lock al pasar a segundo plano: aquí se
 *   vuelve a pedir automáticamente al volver a primer plano mientras
 *   se haya solicitado (wanted = true).
 */
let currentLock = null;
let wanted = false;
let visibilityListener = null;

function attachLock(lock) {
  currentLock = lock;
  lock.addEventListener('release', () => {
    if (currentLock === lock) currentLock = null;
  });
}

export function isWakeLockSupported() {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export async function requestWakeLock() {
  if (!isWakeLockSupported()) return false;
  wanted = true;

  if (!visibilityListener) {
    visibilityListener = () => {
      if (wanted && document.visibilityState === 'visible' && !currentLock) {
        navigator.wakeLock
          .request('screen')
          .then(attachLock)
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
  }

  if (currentLock) return true;
  try {
    attachLock(await navigator.wakeLock.request('screen'));
    return true;
  } catch (err) {
    return false;
  }
}

export async function releaseWakeLock() {
  wanted = false;
  if (visibilityListener) {
    document.removeEventListener('visibilitychange', visibilityListener);
    visibilityListener = null;
  }
  if (currentLock) {
    try {
      await currentLock.release();
    } catch (err) {
      // ya liberado
    }
    currentLock = null;
  }
}
