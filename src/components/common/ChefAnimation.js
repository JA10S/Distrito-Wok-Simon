import React from 'react';

const FLAME =
  'M-72 0 C-82 -36 -60 -56 -46 -84 C-44 -54 -22 -54 -22 -92 C-16 -128 -34 -146 -14 -178 C-4 -152 12 -158 18 -172 C22 -134 52 -128 46 -86 C64 -58 76 -32 70 0 Z';

const SPARKS = [
  { x: 430, y: 180, r: 2, dx: '-30px', dur: '1.9s', delay: '0s' },
  { x: 452, y: 150, r: 1.5, dx: '-10px', dur: '2.3s', delay: '0.4s' },
  { x: 470, y: 120, r: 2.5, dx: '15px', dur: '1.7s', delay: '0.9s' },
  { x: 492, y: 160, r: 2, dx: '35px', dur: '2.1s', delay: '1.3s' },
  { x: 510, y: 140, r: 1.5, dx: '45px', dur: '2.5s', delay: '0.2s' },
  { x: 444, y: 110, r: 1.8, dx: '-20px', dur: '2s', delay: '1.7s' },
  { x: 480, y: 90, r: 2, dx: '8px', dur: '1.8s', delay: '2.1s' },
  { x: 500, y: 70, r: 1.5, dx: '28px', dur: '2.4s', delay: '1.1s' },
  { x: 460, y: 60, r: 2, dx: '-5px', dur: '2.2s', delay: '0.7s' },
  { x: 418, y: 150, r: 1.8, dx: '-40px', dur: '2.6s', delay: '1.9s' }
];

const FOODS = [
  { kind: 'ring', x: 455, y: 190, r: 6, dx: '-18px', dur: '2.1s', delay: '0s' },
  { kind: 'leaf', x: 472, y: 175, color: 'green', dx: '12px', dur: '2.4s', delay: '0.5s' },
  { kind: 'ball', x: 490, y: 195, r: 5, color: 'orange', dx: '25px', dur: '1.9s', delay: '1.1s' },
  { kind: 'ball', x: 445, y: 170, r: 4.5, color: 'green', dx: '-8px', dur: '2.6s', delay: '1.6s' },
  { kind: 'ring', x: 485, y: 155, r: 5, dx: '18px', dur: '2.2s', delay: '2s' },
  { kind: 'leaf', x: 462, y: 160, color: 'orange', dx: '5px', dur: '2.5s', delay: '0.9s' },
  { kind: 'ball', x: 478, y: 200, r: 4, color: 'gold', dx: '-14px', dur: '2.3s', delay: '1.4s' }
];

const animStyle = (item) => ({
  '--dx': item.dx,
  animationDuration: item.dur,
  animationDelay: item.delay
});

function Limb({ d, width }) {
  return (
    <>
      <path d={d} className="chef-limb-edge" strokeWidth={width + 6} />
      <path d={d} className="chef-limb-core" strokeWidth={width} />
    </>
  );
}

function ChefAnimation({ size = 420, className = '' }) {
  return (
    <svg
      viewBox="0 0 640 360"
      width={size}
      height={Math.round((size * 360) / 640)}
      className={`chef-animation ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      role="img"
      aria-label="Chef de cocina preparando comida en un wok con llamas"
    >
      {/* Resplandores de fondo */}
      <ellipse className="chef-glow" cx="465" cy="160" rx="190" ry="150" style={{ opacity: 0.06 }} />
      <ellipse className="chef-glow" cx="465" cy="195" rx="105" ry="85" style={{ opacity: 0.08 }} />
      {/* Reflejo en el piso */}
      <ellipse className="chef-glow" cx="420" cy="352" rx="250" ry="7" style={{ opacity: 0.07 }} />

      {/* Faroles colgantes */}
      <g>
        <path d="M36 0 V24" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="2" fill="none" />
        <rect className="chef-sil" x="28" y="24" width="16" height="6" rx="2" />
        <ellipse className="chef-lantern" cx="36" cy="52" rx="15" ry="23" />
        <path d="M36 30 V74" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
        <path d="M27 36 Q31 52 27 68" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
        <path d="M45 36 Q41 52 45 68" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
      </g>
      <g>
        <path d="M74 0 V40" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="2" fill="none" />
        <rect className="chef-sil" x="66" y="40" width="16" height="6" rx="2" />
        <ellipse className="chef-lantern" cx="74" cy="74" rx="17" ry="25" />
        <path d="M74 50 V98" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
        <path d="M62 56 Q67 74 62 92" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
        <path d="M86 56 Q81 74 86 92" stroke="rgb(var(--color-dorado))" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
      </g>

      {/* Mesa */}
      <rect className="chef-sil" x="210" y="272" width="424" height="14" />
      <rect className="chef-sil" x="218" y="286" width="408" height="60" />

      {/* Props sobre la mesa: tazón de fideos */}
      <path className="chef-sil" d="M226 272 h54 a27 20 0 0 1 -54 0 Z" />
      <path
        d="M234 268 q12 -16 26 -8 q12 -10 20 6"
        stroke="rgb(var(--color-dorado))"
        strokeOpacity="0.8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Olla pequeña */}
      <rect className="chef-sil" x="310" y="246" width="48" height="26" />
      <path
        d="M306 246 H362"
        stroke="rgb(var(--color-dorado))"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle className="chef-sil" cx="334" cy="240" r="4" />
      {/* Botellas de salsa */}
      <rect className="chef-sil" x="544" y="248" width="24" height="24" rx="4" />
      <rect className="chef-sil" x="550" y="222" width="10" height="26" />
      <rect className="chef-sil" x="549" y="214" width="12" height="9" rx="2" />
      <rect className="chef-sil" x="574" y="248" width="22" height="24" rx="4" />
      <rect className="chef-sil" x="579" y="210" width="9" height="38" />
      <rect className="chef-sil" x="577" y="202" width="12" height="9" rx="2" />
      {/* Plato de salsas */}
      <path className="chef-sil" d="M602 272 h30 a15 11 0 0 1 -30 0 Z" />

      {/* Estufa */}
      <rect className="chef-sil" x="394" y="246" width="142" height="6" />
      <rect className="chef-sil" x="398" y="250" width="134" height="22" />
      <circle className="chef-sil" cx="414" cy="262" r="4" />
      <circle className="chef-sil" cx="432" cy="262" r="4" />
      <circle className="chef-sil" cx="450" cy="262" r="4" />

      {/* Chef (cuerpo, brazo trasero con el wok) */}
      <g className="chef-body">
        <circle className="chef-sil" cx="108" cy="52" r="15" />
        <circle className="chef-sil" cx="130" cy="40" r="18" />
        <circle className="chef-sil" cx="152" cy="52" r="14" />
        <rect className="chef-sil" x="103" y="63" width="56" height="18" rx="5" />
        <circle className="chef-sil" cx="131" cy="96" r="24" />
        <path className="chef-sil" d="M154 92 L170 102 L154 110 Z" />
        <rect className="chef-sil" x="121" y="112" width="22" height="18" />
        <path
          className="chef-sil"
          d="M114 118 C98 132 88 156 88 186 C88 214 92 238 96 254 L170 258 C178 232 180 200 176 170 C172 142 160 124 148 116 Z"
        />
        <Limb d="M105 252 L68 296 L44 336" width={30} />
        <Limb d="M150 254 L214 290 L240 332" width={32} />
        <ellipse className="chef-sil" cx="36" cy="345" rx="26" ry="9" />
        <ellipse className="chef-sil" cx="260" cy="345" rx="28" ry="9" />
        <path className="chef-sil" d="M94 240 L176 246 L182 276 L86 270 Z" />
        <path className="chef-detail" d="M136 122 L152 136 L168 124" />
        <circle className="chef-food--gold" cx="170" cy="152" r="3" />
        <circle className="chef-food--gold" cx="172" cy="172" r="3" />
        <circle className="chef-food--gold" cx="170" cy="192" r="3" />
        <Limb d="M112 152 L212 202 L332 226" width={18} />
      </g>

      {/* Wok */}
      <path className="chef-sil" d="M397 216 H533 A68 36 0 0 1 397 216 Z" />
      <path
        d="M391 216 H539"
        stroke="rgb(var(--color-dorado))"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M400 214 L336 228"
        stroke="rgb(var(--color-dorado))"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M530 214 L574 206"
        stroke="rgb(var(--color-dorado))"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Llamas del wok */}
      <g transform="translate(465 216)">
        <g transform="scale(1.1)">
          <path className="chef-flame-back" d={FLAME} />
        </g>
        <g transform="scale(0.95)">
          <path className="chef-flame-mid" d={FLAME} />
        </g>
        <g transform="scale(0.62)">
          <path className="chef-flame-core" d={FLAME} />
        </g>
      </g>
      <g transform="translate(404 220) scale(0.34)">
        <path className="chef-flame-mid" d={FLAME} style={{ animationDelay: '0.3s' }} />
      </g>
      <g transform="translate(526 220) scale(0.32)">
        <path className="chef-flame-mid" d={FLAME} style={{ animationDelay: '0.15s' }} />
      </g>

      {/* Brazo con la espátula (silueta sobre el fuego) */}
      <g className="chef-arm">
        <Limb d="M152 144 L252 152 L336 182" width={18} />
        <Limb d="M336 182 L456 212" width={6} />
        <rect
          className="chef-sil"
          x="446"
          y="202"
          width="38"
          height="18"
          rx="5"
          transform="rotate(14 465 211)"
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

      {/* Trozos de comida volando en el fuego */}
      {FOODS.map((f, i) => {
        if (f.kind === 'leaf') {
          return (
            <g key={`food-${i}`} transform={`translate(${f.x} ${f.y})`}>
              <path
                className={`chef-food chef-food--${f.color}`}
                d="M-9 0 q9 -10 18 -3 q-9 10 -18 3 Z"
                style={animStyle(f)}
              />
            </g>
          );
        }
        if (f.kind === 'ring') {
          return (
            <circle
              key={`food-${i}`}
              className="chef-food chef-food--ring"
              cx={f.x}
              cy={f.y}
              r={f.r}
              style={animStyle(f)}
            />
          );
        }
        return (
          <circle
            key={`food-${i}`}
            className={`chef-food chef-food--${f.color}`}
            cx={f.x}
            cy={f.y}
            r={f.r}
            style={animStyle(f)}
          />
        );
      })}
    </svg>
  );
}

export default ChefAnimation;
