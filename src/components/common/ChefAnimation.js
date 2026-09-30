import React from 'react';

const FLAME =
  'M-72 0 C-82 -36 -60 -56 -46 -84 C-44 -54 -22 -54 -22 -92 C-16 -128 -34 -146 -14 -178 C-4 -152 12 -158 18 -172 C22 -134 52 -128 46 -86 C64 -58 76 -32 70 0 Z';

const SPARKS = [
  { x: 300, y: 150, r: 2, dx: '-20px', dur: '1.9s', delay: '0s' },
  { x: 330, y: 120, r: 2, dx: '14px', dur: '2.1s', delay: '0.4s' },
  { x: 350, y: 155, r: 1.5, dx: '30px', dur: '2.3s', delay: '0.9s' },
  { x: 285, y: 110, r: 1.5, dx: '-12px', dur: '2s', delay: '1.3s' },
  { x: 318, y: 85, r: 2, dx: '4px', dur: '1.8s', delay: '0.7s' }
];

const FOODS = [
  { kind: 'ring', x: 310, y: 175, r: 5, dx: '-14px', dur: '2.1s', delay: '0s' },
  { kind: 'ball', x: 335, y: 165, r: 4, color: 'green', dx: '18px', dur: '2.3s', delay: '0.6s' },
  { kind: 'ball', x: 295, y: 160, r: 4, color: 'orange', dx: '-8px', dur: '2.5s', delay: '1.2s' }
];

const animStyle = (item) => ({
  '--dx': item.dx,
  animationDuration: item.dur,
  animationDelay: item.delay
});

function ChefAnimation({ size = 360, className = '' }) {
  return (
    <svg
      viewBox="0 0 440 360"
      width={size}
      height={Math.round((size * 360) / 440)}
      className={`chef-animation ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label="Chef de cocina preparando comida en un wok con llamas"
      fill="currentColor"
    >
      {/* Resplandor del fuego */}
      <ellipse className="chef-glow" cx="316" cy="150" rx="120" ry="100" style={{ opacity: 0.07 }} />

      {/* Mesa y estufa (segundo plano) */}
      <g className="chef-solid-line" strokeWidth="7" opacity="0.5">
        <path d="M232 248 H424" />
        <path d="M254 248 L248 332" />
        <path d="M402 248 L408 332" />
      </g>
      <rect x="294" y="238" width="44" height="10" opacity="0.55" />

      {/* Chef */}
      <g className="chef-body">
        <circle cx="86" cy="58" r="14" />
        <circle cx="106" cy="46" r="17" />
        <circle cx="126" cy="58" r="13" />
        <rect x="82" y="70" width="48" height="16" rx="5" />
        <circle cx="106" cy="104" r="21" />
        <path d="M125 100 L139 110 L125 118 Z" />
        <rect x="97" y="120" width="18" height="14" />
        <path d="M95 128 C80 142 74 164 74 190 C74 214 78 234 82 248 L148 252 C156 228 158 198 154 172 C150 148 140 132 130 126 Z" />
        <path className="chef-solid-line" d="M92 248 L60 288 L40 326" strokeWidth="26" />
        <path className="chef-solid-line" d="M132 250 L176 284 L196 322" strokeWidth="28" />
        <ellipse cx="32" cy="330" rx="22" ry="8" />
        <ellipse cx="212" cy="330" rx="24" ry="8" />
        <path className="chef-solid-line" d="M96 150 L176 190 L206 216" strokeWidth="16" />
      </g>

      {/* Wok */}
      <path d="M260 210 H372 A56 30 0 0 1 260 210 Z" />
      <path className="chef-solid-line" d="M255 210 H377" strokeWidth="5" />
      <path className="chef-solid-line" d="M262 208 L208 218" strokeWidth="6" />
      <path className="chef-solid-line" d="M370 208 L408 200" strokeWidth="6" />

      {/* Fuego (3 capas) */}
      <g transform="translate(316 210)">
        <g transform="scale(0.78)">
          <path className="chef-flame-back" d={FLAME} />
        </g>
        <g transform="scale(0.66)">
          <path className="chef-flame-mid" d={FLAME} />
        </g>
        <g transform="scale(0.4)">
          <path className="chef-flame-core" d={FLAME} />
        </g>
      </g>
      <g transform="translate(266 214) scale(0.26)">
        <path className="chef-flame-mid" d={FLAME} style={{ animationDelay: '0.3s' }} />
      </g>
      <g transform="translate(364 214) scale(0.26)">
        <path className="chef-flame-mid" d={FLAME} style={{ animationDelay: '0.15s' }} />
      </g>

      {/* Brazo con la espátula (oscura, recortada sobre el fuego) */}
      <g className="chef-arm">
        <path className="chef-solid-line" d="M124 142 L210 150 L284 176" strokeWidth="16" />
        <path className="chef-utensil-line" d="M284 176 L344 196" strokeWidth="6" />
        <rect
          className="chef-utensil"
          x="340"
          y="190"
          width="32"
          height="15"
          rx="4"
          transform="rotate(14 356 197)"
        />
      </g>

      {/* Chispas */}
      {SPARKS.map((s, i) => (
        <circle
          key={`spark-${i}`}
          className="chef-spark"
          cx={s.x}
          cy={s.y}
          r={s.r}
          style={animStyle(s)}
        />
      ))}

      {/* Trozos de comida */}
      {FOODS.map((f, i) =>
        f.kind === 'ring' ? (
          <circle
            key={`food-${i}`}
            className="chef-food chef-food--ring"
            cx={f.x}
            cy={f.y}
            r={f.r}
            style={animStyle(f)}
          />
        ) : (
          <circle
            key={`food-${i}`}
            className={`chef-food chef-food--${f.color}`}
            cx={f.x}
            cy={f.y}
            r={f.r}
            style={animStyle(f)}
          />
        )
      )}
    </svg>
  );
}

export default ChefAnimation;
