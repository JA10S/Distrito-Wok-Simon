import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { app } from '../services/firebase';

const db = getFirestore(app);

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000
};

// Evita una escritura por cada posición: como mínimo 5 s entre actualizaciones
const MIN_WRITE_INTERVAL = 5000;

// El domiciliario comparte su ubicación manualmente desde su panel.
// Escribe su propio documento en driverLocations/{uid} (las reglas solo permiten escribir el propio).
export function useDriverLocation(user) {
  const [sharing, setSharing] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);
  const lastWriteRef = useRef(0);

  const supported =
    typeof navigator !== 'undefined' && !!navigator.geolocation;

  const writePosition = useCallback(
    async (coords) => {
      if (!user?.uid) return;

      const now = Date.now();
      if (now - lastWriteRef.current < MIN_WRITE_INTERVAL) return;
      lastWriteRef.current = now;

      const payload = {
        driverId: user.uid,
        driverName: user.displayName || user.email || '',
        driverEmail: user.email || '',
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: typeof coords.accuracy === 'number' ? Math.round(coords.accuracy) : null,
        sharing: true,
        updatedAt: serverTimestamp()
      };

      try {
        await setDoc(doc(db, 'driverLocations', user.uid), payload, { merge: true });
      } catch (err) {
        console.error('Error saving driver location:', err);
        setError('No se pudo guardar la ubicación: ' + err.message);
      }
    },
    [user]
  );

  const stopSharing = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);

    if (!user?.uid) return;
    try {
      await setDoc(
        doc(db, 'driverLocations', user.uid),
        { sharing: false, stoppedAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err) {
      console.error('Error stopping location sharing:', err);
    }
  }, [user]);

  const startSharing = useCallback(() => {
    if (!supported) {
      setError('Tu navegador no soporta la geolocalización');
      return;
    }
    if (!user?.uid) {
      setError('Sin usuario autenticado');
      return;
    }
    if (watchIdRef.current !== null) return;

    setError('');
    lastWriteRef.current = 0;
    setSharing(true);

    // Marca como activo de inmediato (antes de la primera posición)
    setDoc(
      doc(db, 'driverLocations', user.uid),
      {
        driverId: user.uid,
        driverName: user.displayName || user.email || '',
        driverEmail: user.email || '',
        sharing: true,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    ).catch((err) => {
      console.error('Error enabling location sharing:', err);
      setError('No se pudo activar la ubicación: ' + err.message);
      setSharing(false);
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: pos.timestamp
        });
        setError('');
        writePosition(pos.coords);
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Permiso de ubicación denegado. Actívalo en los ajustes del navegador.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'No se pudo obtener la ubicación (señal no disponible)'
            : 'Tiempo de espera agotado al obtener la ubicación';
        setError(message);
        setSharing(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      WATCH_OPTIONS
    );
  }, [supported, user, writePosition]);

  // Limpia el watch al desmontar (no escribe: evita carreras con StrictMode/remezclas)
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    supported,
    sharing,
    position,
    error,
    startSharing,
    stopSharing
  };
}
