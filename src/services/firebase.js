import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../config/firebase';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Analytics y Messaging (opcionales).
// Solo en navegadores con soporte real: jsdom/test y navegadores antiguos
// lanzan rechazos asíncronos que rompen la ejecución.
const supportsBrowserAPIs =
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof indexedDB !== 'undefined';

let analytics;
let messaging;

if (supportsBrowserAPIs) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics no disponible:', error.message);
    analytics = null;
  }

  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Cloud Messaging no disponible:', error.message);
    messaging = null;
  }
}

export { app, analytics, messaging };
export default app;