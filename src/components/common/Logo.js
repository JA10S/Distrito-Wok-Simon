import React from 'react';

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Distrito Wok Simón"
    >
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="23.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path
        d="M16.5 32.5 L9.5 29.5 M47.5 32.5 L54.5 29.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M17 33 H47 A15 15 0 0 1 17 33 Z" fill="currentColor" />
      <path
        d="M26 25.5 c2.5 -3 -2.5 -5 0 -8.5 M32 24 c2.5 -3.5 -2.5 -6 0 -9.5 M38 25.5 c2.5 -3 -2.5 -5 0 -8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="4.2" r="2.2" fill="#C40F0F" />
    </svg>
  );
}

function Logo({ size = 40, showText = false, className = '', textClass = '' }) {
  if (!showText) {
    return <LogoMark size={size} className={`text-dorado ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={size} className="text-dorado shrink-0" />
      <div className="leading-none text-left min-w-0">
        <div className={`tracking-[0.4em] text-dorado-oscuro ${textClass} uppercase`}>
          Distrito
        </div>
        <div className={`font-cormorant font-bold text-gold-gradient ${textClass}`}>
          Wok Simón
        </div>
      </div>
    </div>
  );
}

export default Logo;
