import React from 'react';
import Logo from '../common/Logo';
import { FaSignOutAlt, FaChevronLeft } from 'react-icons/fa';

function DashboardHeader({ title, user, onLogout, activeTab, onTabChange, tabs = [], onBack, backLabel = 'Admin' }) {
  return (
    <>
      <header className="bg-negro border-b border-dorado/30 py-3 sm:py-4">
        <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
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
          <button
            onClick={onLogout}
            className="bg-[#6e1414] hover:bg-[#8a1d1d] border border-[#a52a2a]/50 hover:border-[#c23636]/70 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base hover-lift shrink-0 transition-colors shadow-[0_4px_14px_-8px_rgba(165,42,42,0.9)]"
          >
            <FaSignOutAlt aria-hidden="true" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      <nav className="bg-negro/95 backdrop-blur-sm border-b border-dorado-oscuro/30 sticky top-0 z-20">
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
    </>
  );
}

export default DashboardHeader;
