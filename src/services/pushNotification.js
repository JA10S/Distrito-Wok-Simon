// Servicio de notificaciones push
// Utiliza Firebase Cloud Messaging (FCM)

import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';

/**
 * Solicitar permiso para notificaciones push
 * @returns {Promise<string|null>} - Token FCM o null si no se concedió permiso
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const token = await getFCMToken();
      return token;
    } else {
      console.log('Permiso de notificaciones no concedido');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Obtener token FCM
 * @returns {Promise<string|null>} - Token FCM o null
 */
export const getFCMToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_VAPID_KEY,
    });
    
    if (token) {
      console.log('Token FCM obtenido:', token);
      return token;
    } else {
      console.log('No se pudo obtener el token FCM');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Escuchar mensajes push en primer plano
 * @param {Function} callback - Función a ejecutar cuando llegue un mensaje
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onMessageListener = (callback) => {
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensaje push recibido:', payload);
      callback(payload);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {};
  }
};

/**
 * Mostrar notificación local
 * @param {string} title - Título de la notificación
 * @param {Object} options - Opciones de la notificación
 */
export const showLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
};

/**
 * Enviar notificación a un token específico (requiere servidor)
 * @param {string} token - Token FCM del destinatario
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 * @param {Object} data - Datos adicionales
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
  try {
    // Esta función debería implementarse en el servidor
    // Aquí solo mostramos la estructura
    const message = {
      to: token,
      notification: {
        title,
        body,
      },
      data,
    };
    
    console.log('Notificación push a enviar:', message);
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Guardar token en Firestore
 * @param {string} userId - ID del usuario
 * @param {string} token - Token FCM
 */
export const saveFCMToken = async (userId, token) => {
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    await setDoc(doc(db, 'fcmTokens', userId), {
      token,
      updatedAt: new Date(),
      platform: 'web',
    });
    
    console.log('Token FCM guardado en Firestore');
    return { success: true };
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar token de Firestore
 * @param {string} userId - ID del usuario
 */
export const deleteFCMToken = async (userId) => {
  try {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    
    await deleteDoc(doc(db, 'fcmTokens', userId));
    
    console.log('Token FCM eliminado de Firestore');
    return { success: true };
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    return { success: false, error: error.message };
  }
};