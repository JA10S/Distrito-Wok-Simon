import { useEffect, useState } from 'react';
import { app } from '../../services/firebase';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';

/* Inyecta el CSS guardado del admin (settings/custom_css) en un <style> del <head>.
   Se usa textContent (no innerHTML) para que un </style> dentro del CSS
   no pueda romper el documento. Montado una vez en App.js. */
export const CUSTOM_CSS_STYLE_ID = 'dw-custom-css';
const MAX_CSS_LENGTH = 10000;

function CustomCssInjector() {
  const [css, setCss] = useState('');

  useEffect(() => {
    const db = getFirestore(app);
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'custom_css'),
      (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() : {};
        setCss(typeof data.css === 'string' ? data.css.slice(0, MAX_CSS_LENGTH) : '');
      },
      () => {
        // Sin permisos/red: no se inyecta nada
        setCss('');
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let el = document.getElementById(CUSTOM_CSS_STYLE_ID);
    if (!css) {
      if (el) el.remove();
      return undefined;
    }
    if (!el) {
      el = document.createElement('style');
      el.id = CUSTOM_CSS_STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
    return () => {
      const current = document.getElementById(CUSTOM_CSS_STYLE_ID);
      if (current) current.remove();
    };
  }, [css]);

  return null;
}

export default CustomCssInjector;
