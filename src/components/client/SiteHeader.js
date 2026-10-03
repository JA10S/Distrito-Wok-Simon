import React from 'react';
import Logo from '../common/Logo';
import ModeToggle from '../common/ModeToggle';
import { FaBars } from 'react-icons/fa';

function SiteHeader({ layout, sections, onOpenMenu }) {
  const compact = layout !== 'clasic';
  const sideMenuButton = layout === 'side' ? 'lg:hidden' : '';

  return (
    <>
      {/* Barra superior (solo disposiciones no clásicas) */}
      {compact && (
        <header
          className={`sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-line/60 ${
            layout === 'side' ? 'lg:hidden' : ''
          }`}
        >
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onOpenMenu}
                aria-label="Abrir menú"
                className={`shrink-0 w-9 h-9 rounded-lg border border-dorado/40 bg-dorado/10 text-dorado flex items-center justify-center hover:bg-dorado hover:text-negro transition-colors ${sideMenuButton}`}
              >
                <FaBars aria-hidden="true" />
              </button>
              <Logo size={34} className="shrink-0" />
              <span className="font-cormorant text-lg sm:text-xl font-bold truncate">
                <span className="text-ink">Distrito </span>
                <span className="text-gold-gradient">Wok</span>
              </span>
            </div>
            <ModeToggle />
          </div>
        </header>
      )}

      {/* Hero de marca */}
      <header
        className={`relative bg-gradient-to-b from-surface-2 via-surface to-surface border-b border-dorado-oscuro/30 ${
          compact ? 'py-6 sm:py-8' : 'py-10 sm:py-14'
        } overflow-hidden pattern-bg`}
      >
        <div className="absolute top-4 left-4 text-4xl animate-float hidden sm:block" aria-hidden="true">🏮</div>
        <div className="absolute top-4 right-4 text-4xl animate-float hidden sm:block" style={{ animationDelay: '1.2s' }} aria-hidden="true">🏮</div>

        <div className="text-center mb-5">
          <span className="text-dorado/60 text-xs sm:text-sm tracking-[0.5em] font-light">
            道 場 名 店 ・ 風 味 東 方
          </span>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          <Logo size={compact ? 64 : 90} className="glow sm:hidden" />
          <Logo size={compact ? 76 : 120} className="glow hidden sm:block" />
          <h1 className={`font-cormorant font-bold mt-4 ${compact ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-4xl sm:text-5xl md:text-7xl'}`}>
            <span className="text-ink">DISTRITO </span>
            <span className="text-gold-gradient">WOK </span>
            <span className="text-ink">SIMÓN</span>
          </h1>
          <p className="text-dorado-oscuro mt-2 tracking-[0.3em] text-xs sm:text-sm uppercase">
            ★ Sabor que enamora ★
          </p>
        </div>

        <div className="flex justify-center mt-4 space-x-2" aria-hidden="true">
          <span className="text-dorado/40">✦</span>
          <span className="text-rojo/60">◈</span>
          <span className="text-dorado/40">✦</span>
        </div>
      </header>

      {/* Píldoras de categorías (solo disposición clásica) */}
      {layout === 'clasic' && (
        <div className="glass border-b border-dorado-oscuro/30 py-3 sticky top-0 z-10">
          <div className="container mx-auto px-4 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="px-3 sm:px-4 py-2 bg-dorado/10 border border-dorado/30 rounded-full text-dorado text-xs sm:text-sm whitespace-nowrap hover:bg-dorado hover:text-negro transition-colors"
              >
                {section.emoji} {section.label}
              </a>
            ))}
            <ModeToggle className="ml-auto" />
          </div>
        </div>
      )}
    </>
  );
}

export default SiteHeader;
