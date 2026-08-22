import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../config/firebase';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Analytics (opcional)
let analytics;
let messaging;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase Cloud Messaging no disponible:', error.message);
    messaging = null;
  }
}

export { app, analytics, messaging };
export default app;