import { useState, useEffect, useCallback } from 'react';
import { app } from '../services/firebase';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';

/* CSS personalizado del administrador.
   Documento Firestore: settings/custom_css → { css: string, updatedAt: number }
   Lectura pública (regla settings) para que el inyector aplique el CSS sin sesión. */
export const MAX_CSS_LENGTH = 10000;

const db = getFirestore(app);
const CSS_DOC = () => doc(db, 'settings', 'custom_css');

function sanitizeCss(value) {
  return typeof value === 'string' ? value.slice(0, MAX_CSS_LENGTH) : '';
}

export function useCustomCss() {
  const [css, setCss] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      CSS_DOC(),
      (snapshot) => {
        setCss(sanitizeCss(snapshot.exists() ? snapshot.data().css : ''));
        setLoading(false);
      },
      () => {
        // Sin permisos/red: la página sigue sin CSS personalizado
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveCss = useCallback(async (value) => {
    try {
      const next = sanitizeCss(value);
      await setDoc(CSS_DOC(), { css: next, updatedAt: Date.now() }, { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const resetCss = useCallback(async () => {
    try {
      await setDoc(CSS_DOC(), { css: '', updatedAt: Date.now() }, { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return { css, loading, saveCss, resetCss };
}

export default useCustomCss;
