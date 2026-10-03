import React from 'react';
import Logo from '../common/Logo';
import { FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

function MenuDrawer({ open, onClose, sections, hideOnDesktop = false }) {
  const { isLight, toggleMode } = useTheme();
  const desktopClass = hideOnDesktop ? 'lg:hidden' : '';

  return (
    <>
      {open && (
        <div
          className={`fixed inset-0 z-40 bg-black/60 ${desktopClass}`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-label="Menú de categorías"
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-surface border-r border-line/60 shadow-2xl p-5 flex flex-col gap-5 transition-transform duration-300 ${desktopClass} ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <Logo size={44} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="w-9 h-9 rounded-full border border-dorado/40 text-dorado flex items-center justify-center hover:bg-dorado hover:text-negro transition-colors"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <p className="font-cormorant text-xl text-gold-gradient">Distrito Wok Simón</p>

        <nav className="flex flex-col gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dorado-oscuro/30 bg-surface-2 text-dorado-claro hover:border-dorado/50 hover:bg-dorado/10 transition-colors"
            >
              <span className="text-dorado text-xl" aria-hidden="true">{section.icon}</span>
              <span>{section.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/60 pt-4">
          <span className="text-dorado-oscuro text-xs uppercase tracking-widest">Modo</span>
          <button
            type="button"
            onClick={toggleMode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dorado/40 bg-dorado/10 text-dorado text-sm hover:bg-dorado hover:text-negro transition-colors"
          >
            {isLight ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
            {isLight ? 'Nocturno' : 'Diurno'}
          </button>
        </div>
      </aside>
    </>
  );
}

export { MenuDrawer };
export default MenuDrawer;
