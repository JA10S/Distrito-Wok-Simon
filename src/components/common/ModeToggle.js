import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

function ModeToggle({ className = '', label = '' }) {
  const { isLight, toggleMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isLight ? 'Cambiar a modo nocturno' : 'Cambiar a modo diurno'}
      title={isLight ? 'Modo nocturno' : 'Modo diurno'}
      className={`shrink-0 w-9 h-9 rounded-full border border-dorado/40 bg-dorado/10 text-dorado flex items-center justify-center gap-2 hover:bg-dorado hover:text-negro transition-colors ${className}`}
    >
      {isLight ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
      {label && <span className="text-xs font-semibold">{label}</span>}
    </button>
  );
}

export default ModeToggle;
