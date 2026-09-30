import React from 'react';

function ChefAnimation({ size = 300, className = '' }) {
  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={Math.round((size * 200) / 240)}
      className={`chef-animation ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label="Chef cocinando en un wok"
      fill="currentColor"
    >
      {/* Suelo / resplandor */}
      <ellipse cx="135" cy="179" rx="96" ry="9" opacity="0.12" />

      {/* Chef: gorro, cabeza, cuerpo y mandil */}
      <g className="chef-body">
        <circle cx="64" cy="30" r="11" />
        <circle cx="78" cy="23" r="13" />
        <circle cx="92" cy="30" r="11" />
        <rect x="60" y="37" width="36" height="13" rx="4" />
        <circle cx="78" cy="62" r="15" />
        <rect x="72" y="73" width="13" height="13" />
        <path d="M64 82 C56 96 54 116 56 134 L50 167 H108 L100 132 C102 114 100 96 92 82 Z" />
        <rect x="54" y="167" width="48" height="9" rx="3" />
      </g>

      {/* Estufa */}
      <rect x="130" y="156" width="76" height="13" rx="4" opacity="0.7" />

      {/* Wok */}
      <path d="M118 112 H212 A47 36 0 0 1 118 112 Z" />
      <line
        x1="114" y1="112" x2="216" y2="112"
        stroke="currentColor" strokeWidth="5" strokeLinecap="round"
      />
      <line
        x1="118" y1="110" x2="102" y2="104"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round"
      />
      <line
        x1="212" y1="110" x2="228" y2="104"
        stroke="currentColor" strokeWidth="6" strokeLinecap="round"
      />

      {/* Llamas del wok */}
      <g fill="rgb(var(--color-rojo))">
        <g transform="translate(136 157)">
          <path className="chef-flame" d="M0 0 q-8 -10 -2 -24 q11 10 6 24 Z" />
          <path
            className="chef-flame"
            d="M0 0 q-5 -7 -1 -16 q7 7 4 16 Z"
            fill="rgb(var(--color-dorado))"
            style={{ animationDelay: '0.15s' }}
          />
        </g>
        <g transform="translate(198 157)">
          <path
            className="chef-flame"
            d="M0 0 q-8 -10 -2 -24 q11 10 6 24 Z"
            style={{ animationDelay: '0.22s' }}
          />
          <path
            className="chef-flame"
            d="M0 0 q-5 -7 -1 -16 q7 7 4 16 Z"
            fill="rgb(var(--color-dorado))"
            style={{ animationDelay: '0.08s' }}
          />
        </g>
        <g transform="translate(152 157)">
          <path
            className="chef-flame"
            d="M0 0 q-7 -8 -2 -19 q9 8 5 19 Z"
            style={{ animationDelay: '0.3s' }}
          />
        </g>
        <g transform="translate(168 157)">
          <path
            className="chef-flame"
            d="M0 0 q-7 -8 -2 -19 q9 8 5 19 Z"
            style={{ animationDelay: '0.05s' }}
          />
          <path
            className="chef-flame"
            d="M0 0 q-5 -7 -1 -16 q7 7 4 16 Z"
            fill="rgb(var(--color-dorado))"
            style={{ animationDelay: '0.26s' }}
          />
        </g>
        <g transform="translate(184 157)">
          <path
            className="chef-flame"
            d="M0 0 q-7 -8 -2 -19 q9 8 5 19 Z"
            style={{ animationDelay: '0.18s' }}
          />
        </g>
      </g>

      {/* Brazo que revuelve + espátula */}
      <g className="chef-stir-arm">
        <path
          d="M96 86 L118 66 L144 78"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="144" cy="78" r="7" />
        <path
          d="M146 80 L168 102"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect
          x="162" y="97" width="20" height="11" rx="3"
          transform="rotate(40 172 102)"
        />
      </g>

      {/* Vapor sobre el wok */}
      <g
        stroke="rgb(var(--color-dorado-claro))"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      >
        <g transform="translate(140 104)">
          <path className="chef-steam" d="M0 0 c5 -7 -5 -11 0 -18 c5 -7 -5 -11 0 -18" />
        </g>
        <g transform="translate(165 102)">
          <path
            className="chef-steam"
            d="M0 0 c5 -7 -5 -11 0 -18 c5 -7 -5 -11 0 -18"
            style={{ animationDelay: '0.9s' }}
          />
        </g>
        <g transform="translate(190 104)">
          <path
            className="chef-steam"
            d="M0 0 c5 -7 -5 -11 0 -18 c5 -7 -5 -11 0 -18"
            style={{ animationDelay: '1.7s' }}
          />
        </g>
      </g>
    </svg>
  );
}

export default ChefAnimation;
