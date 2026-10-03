import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { app } from '../services/firebase';
import {
  DEFAULT_THEME,
  sanitizeTheme,
  applyTheme,
  resolveMode
} from '../utils/themeUtils';

const db = getFirestore(app);
const THEME_DOC = doc(db, 'settings', 'theme');
const MODE_KEY = 'dw-mode';

const readLocalMode = () => {
  try {
    return window.localStorage.getItem(MODE_KEY) || null;
  } catch (error) {
    return null;
  }
};

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  resolvedMode: 'dark',
  isLight: false,
  setLocalMode: () => {},
  toggleMode: () => {},
  saveTheme: async () => ({ success: true }),
  resetTheme: async () => ({ success: true })
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [localMode, setLocalModeState] = useState(readLocalMode);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      THEME_DOC,
      (snapshot) => {
        setTheme(sanitizeTheme(snapshot.exists() ? snapshot.data() : null));
      },
      (error) => {
        console.warn('No se pudo cargar el tema personalizado:', error.message);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  /* El modo guardado en el navegador del visitante tiene prioridad sobre
     el que fija el administrador en Firestore. 'system' sigue la preferencia
     del sistema operativo. */
  const resolvedMode =
    localMode === 'dark' || localMode === 'light'
      ? localMode
      : resolveMode(localMode === 'system' ? { ...theme, mode: 'system' } : theme);

  useEffect(() => {
    applyTheme(theme, resolvedMode);
  }, [theme, resolvedMode]);

  const setLocalMode = useCallback((mode) => {
    setLocalModeState(mode);
    try {
      if (mode) window.localStorage.setItem(MODE_KEY, mode);
      else window.localStorage.removeItem(MODE_KEY);
    } catch (error) {
      /* navegadores en modo privado: se aplica solo en memoria */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setLocalModeState((current) => {
      const effective = current || resolveMode(theme);
      const next = effective === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(MODE_KEY, next);
      } catch (error) {
        /* ignorado */
      }
      return next;
    });
  }, [theme]);

  const saveTheme = useCallback(async (draft) => {
    const next = sanitizeTheme(draft);
    try {
      await setDoc(THEME_DOC, next, { merge: true });
      setTheme(next);
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
      setLocalMode(null);
      return { success: true };
    } catch (error) {
      console.error('Error restaurando tema:', error);
      return { success: false, error: error.message };
    }
  }, [setLocalMode]);

  const value = useMemo(
    () => ({
      theme,
      resolvedMode,
      isLight: resolvedMode === 'light',
      setLocalMode,
      toggleMode,
      saveTheme,
      resetTheme
    }),
    [theme, resolvedMode, setLocalMode, toggleMode, saveTheme, resetTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
