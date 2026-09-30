import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { app } from '../services/firebase';
import { DEFAULT_THEME, sanitizeTheme, applyTheme } from '../utils/themeUtils';

const db = getFirestore(app);
const THEME_DOC = doc(db, 'settings', 'theme');

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  saveTheme: async () => {},
  resetTheme: async () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      THEME_DOC,
      (snapshot) => {
        const next = sanitizeTheme(snapshot.exists() ? snapshot.data() : null);
        setTheme(next);
        applyTheme(next);
      },
      (error) => {
        console.warn('No se pudo cargar el tema personalizado:', error.message);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const saveTheme = useCallback(async (draft) => {
    const next = sanitizeTheme(draft);
    try {
      await setDoc(THEME_DOC, next, { merge: true });
      setTheme(next);
      applyTheme(next);
      return { success: true };
    } catch (error) {
      console.error('Error guardando tema:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const resetTheme = useCallback(async () => {
    try {
      await setDoc(THEME_DOC, DEFAULT_THEME, { merge: false });
      setTheme(DEFAULT_THEME);
      applyTheme(DEFAULT_THEME);
      return { success: true };
    } catch (error) {
      console.error('Error restaurando tema:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, saveTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
