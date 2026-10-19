import { useState, useEffect, useCallback } from 'react';
import { app } from '../services/firebase';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { DEFAULT_LAYOUT, sanitizeLayout } from '../utils/layoutUtils';

const db = getFirestore(app);
const LAYOUT_DOC = () => doc(db, 'settings', 'layout');

/* Diseño de la página del menú (settings/layout) en tiempo real.
   Sin documento guardado → se usan los valores por defecto. */
export function useMenuLayout() {
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      LAYOUT_DOC(),
      (snapshot) => {
        setLayout(
          sanitizeLayout(snapshot.exists() ? snapshot.data() : null)
        );
        setLoading(false);
      },
      () => {
        // Sin permisos/red: la página sigue con los valores por defecto
        setLayout((current) => sanitizeLayout(current));
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveLayout = useCallback(async (data) => {
    try {
      await setDoc(LAYOUT_DOC(), sanitizeLayout(data), { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const resetLayout = useCallback(async () => {
    try {
      await setDoc(LAYOUT_DOC(), DEFAULT_LAYOUT, { merge: false });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return { layout, loading, saveLayout, resetLayout };
}

export default useMenuLayout;
