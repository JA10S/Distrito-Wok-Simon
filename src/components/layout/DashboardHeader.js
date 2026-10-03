import React, { useState } from 'react';
import Logo from '../common/Logo';
import ModeToggle from '../common/ModeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSignOutAlt, FaChevronLeft, FaBars, FaTimes } from 'react-icons/fa';

function DashboardHeader({ title, user, onLogout, activeTab, onTabChange, tabs = [], onBack, backLabel = 'Admin' }) {
  const { theme } = useTheme();
  const layout = (theme && theme.layout) || 'clasic';
  const [menuOpen, setMenuOpen] = useState(false);

  const showMenuButton = layout !== 'clasic';
  const menuButtonClass = layout === 'side' ? 'lg:hidden' : '';
  const barVisible = layout === 'hamburger' ? 'hidden' : layout === 'side' ? 'hidden lg:block' : '';

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="bg-surface border-b border-dorado/30 py-3 sm:py-4">
        <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {showMenuButton && (
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menú"
                className={`shrink-0 w-9 h-9 rounded-lg border border-dorado/40 bg-dorado/10 text-dorado flex items-center justify-center hover:bg-dorado hover:text-negro transition-colors ${menuButtonClass}`}
              >
                <FaBars aria-hidden="true" />
              </button>
            )}
            <Logo size={44} className="shrink-0" />
            <div className="min-w-0">
              <h1 className="font-cormorant text-xl sm:text-2xl font-bold text-dorado-claro truncate">
                {title}
              </h1>
              <p className="text-dorado-oscuro text-xs sm:text-sm truncate">
                👤 {user}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />
            <button
              onClick={onLogout}
              className="bg-[#6e1414] hover:bg-[#8a1d1d] border border-[#a52a2a]/50 hover:border-[#c23636]/70 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base hover-lift transition-colors shadow-[0_4px_14px_-8px_rgba(165,42,42,0.9)]"
            >
              <FaSignOutAlt aria-hidden="true" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <nav className={`bg-surface/95 backdrop-blur-sm border-b border-dorado-oscuro/30 sticky top-0 z-20 ${barVisible}`}>
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
            {onBack && (
              <button
                onClick={onBack}
                className="py-3 px-3 font-medium text-dorado-oscuro hover:text-dorado-claro flex items-center gap-1 whitespace-nowrap transition-colors"
              >
                <FaChevronLeft aria-hidden="true" className="text-xs" />
                {backLabel}
              </button>
            )}
            {tabs.map((tab) => {
              const label = tab.badge !== undefined && tab.badge !== null
                ? `${tab.label} (${tab.badge})`
                : tab.label;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`py-3 px-3 font-medium whitespace-nowrap flex items-center gap-2 transition-colors relative ${
                    isActive
                      ? 'tab-active text-dorado'
                      : 'text-dorado-oscuro hover:text-dorado-claro'
                  }`}
                >
                  {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Menú lateral de pestañas (disposiciones no clásicas) */}
      {showMenuButton && (
        <>
          {menuOpen && (
            <div className="fixed inset-0 z-40 bg-black/60" onClick={closeMenu} aria-hidden="true" />
          )}
          <aside
            aria-label="Menú de secciones"
            className={`fixed top-0 left-0 z-50 h-full w-64 max-w-[85vw] bg-surface border-r border-line/60 shadow-2xl p-4 flex flex-col gap-4 transition-transform duration-300 ${
              menuOpen ? 'translate-x-0' : '-translate-x-full'
            } ${layout === 'side' ? 'lg:hidden' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Logo size={32} className="shrink-0" />
                <span className="font-cormorant text-lg font-bold text-dorado-claro truncate">
                  {title}
                </span>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                className="shrink-0 w-9 h-9 rounded-full border border-dorado/40 text-dorado flex items-center justify-center hover:bg-dorado hover:text-negro transition-colors"
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {onBack && (
                <button
                  onClick={() => { onBack(); closeMenu(); }}
                  className="py-2.5 px-3 rounded-lg text-left font-medium text-dorado-oscuro hover:text-dorado-claro hover:bg-dorado/10 flex items-center gap-2 transition-colors"
                >
                  <FaChevronLeft aria-hidden="true" className="text-xs" />
                  {backLabel}
                </button>
              )}
              {tabs.map((tab) => {
                const label = tab.badge !== undefined && tab.badge !== null
                  ? `${tab.label} (${tab.badge})`
                  : tab.label;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { onTabChange(tab.id); closeMenu(); }}
                    className={`py-2.5 px-3 rounded-lg text-left font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-dorado/15 text-dorado border border-dorado/40'
                        : 'text-dorado-oscuro hover:text-dorado-claro hover:bg-dorado/10 border border-transparent'
                    }`}
                  >
                    {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}

export default DashboardHeader;
