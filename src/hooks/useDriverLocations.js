import { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { app } from '../services/firebase';
import { timestampMs } from '../utils/orderUtils';

const db = getFirestore(app);

export const LOCATION_STALE_MS = 3 * 60 * 1000;

export function isLocationStale(location, now = Date.now()) {
  const ms = timestampMs(location?.updatedAt);
  if (!ms) return true;
  return now - ms > LOCATION_STALE_MS;
}

// Posiciones en tiempo real de los domiciliarios (driverLocations/{uid})
export function useDriverLocations() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, 'driverLocations'), orderBy('updatedAt', 'desc')),
      (snapshot) => {
        const data = [];
        snapshot.forEach((item) => {
          const location = { id: item.id, ...item.data() };
          if (typeof location.lat === 'number' && typeof location.lng === 'number') {
            data.push(location);
          }
        });
        setDrivers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching driver locations:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Solo los que comparten y tienen señal reciente
  const activeDrivers = drivers.filter(
    (driver) => driver.sharing !== false && !isLocationStale(driver)
  );

  return { drivers, activeDrivers, loading, error };
}
