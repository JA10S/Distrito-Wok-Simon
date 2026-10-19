import React, { useState, useEffect, useRef } from 'react';
import { useCustomCss, MAX_CSS_LENGTH } from '../../hooks/useCustomCss';

/* Ejemplos de selectores frecuentes (copiar = pegar en el textarea) */
const EXAMPLES = [
  {
    label: 'Botón dorado en píldora',
    code: '.btn-gold { border-radius: 9999px; }'
  },
  {
    label: 'Tarjetas del menú con sombra',
    code: 'main section .grid > div { box-shadow: 0 4px 14px rgba(0,0,0,.25); }'
  },
  {
    label: 'Títulos más grandes',
    code: 'h2 { font-size: 1.9rem; }'
  },
  {
    label: 'Ocultar el pie del menú',
    code: 'footer { display: none; }'
  },
  {
    label: 'Navbar translúcida',
    code: 'nav { background: rgba(13,13,13,.72) !important; }'
  }
];

function CustomCssEditor() {
  const { css, loading, saveCss, resetCss } = useCustomCss();
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(css);

  useEffect(() => {
    savedRef.current = css;
    setDraft(css);
  }, [css]);

  const dirty = draft !== savedRef.current;
  const overLimit = draft.length > MAX_CSS_LENGTH;

  const handleChange = (value) => {
    setDraft(value);
    setStatus('');
  };

  const handleSave = async () => {
    if (overLimit) return;
    setSaving(true);
    setStatus('');
    const result = await saveCss(draft);
    setSaving(false);
    setStatus(result && result.success ? 'saved' : 'error');
  };

  const handleReset = async () => {
    if (!window.confirm('¿Quitar todo el CSS personalizado?')) return;
    const result = await resetCss();
    setStatus(result && result.success ? 'reset' : 'error');
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-cormorant text-dorado-claro">CSS personalizado</h3>
        <p className="text-dorado-oscuro text-sm">
          Control puntual de cualquier elemento: escribe reglas CSS y se aplican en vivo
          a todas las páginas (menú, login y dashboards). Guarda el CSS de tu tema para
          no perderlo al actualizar el código.
        </p>
      </div>

      <label className="block text-xs text-dorado-oscuro mb-2">
        Tus reglas CSS (máx. {MAX_CSS_LENGTH.toLocaleString()} caracteres)
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          placeholder={'/* Ejemplo */\n.btn-gold { border-radius: 9999px; }'}
          className="mt-1 w-full h-64 bg-surface-3 border border-dorado-oscuro/30 rounded-lg p-3 text-sm font-mono text-dorado-claro focus:border-dorado focus:outline-none resize-y"
        />
      </label>

      <div className="flex items-center justify-between text-xs text-dorado-oscuro mb-4">
        <span className={overLimit ? 'text-rojo font-bold' : ''}>
          {draft.length} / {MAX_CSS_LENGTH.toLocaleString()} caracteres
        </span>
        {dirty && (
          <span className="text-amber-300 font-inter" role="status">
            Cambios sin guardar
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty || overLimit}
          className="bg-dorado hover:bg-dorado-oscuro disabled:opacity-40 text-negro font-bold py-2 px-5 rounded"
        >
          {saving ? 'Guardando...' : 'Guardar CSS'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!savedRef.current}
          className="bg-surface-3 hover:bg-ink/10 disabled:opacity-40 text-dorado-claro font-bold py-2 px-4 rounded border border-dorado-oscuro/30"
        >
          Quitar CSS
        </button>
        {status === 'saved' && (
          <span className="text-emerald-300 text-sm font-inter" role="status">
            ✓ CSS guardado
          </span>
        )}
        {status === 'reset' && (
          <span className="text-emerald-300 text-sm font-inter" role="status">
            ✓ CSS eliminado
          </span>
        )}
        {status === 'error' && (
          <span className="text-rojo text-sm font-inter" role="status">
            No se pudo guardar. ¿Iniciaste sesión como administrador?
          </span>
        )}
      </div>

      {loading && (
        <p className="text-dorado-oscuro text-sm" role="status">
          Cargando CSS guardado…
        </p>
      )}

      <div className="bg-surface-2 rounded-lg p-5 border border-dorado-oscuro/20">
        <h4 className="text-dorado-claro font-bold text-sm mb-1">Ejemplos</h4>
        <p className="text-dorado-oscuro text-xs mb-3">
          Copia un ejemplo al textarea y ajústalo a tu gusto. Usa las clases de Tailwind
          del proyecto (btn-gold, bg-surface-2, text-dorado, font-cormorant, etc.).
        </p>
        <ul className="space-y-2">
          {EXAMPLES.map((example) => (
            <li key={example.label} className="bg-surface-3 rounded p-2.5 border border-dorado-oscuro/20">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-dorado-claro text-xs font-bold">{example.label}</span>
                <button
                  type="button"
                  onClick={() => handleChange(draft ? `${draft}\n${example.code}` : example.code)}
                  className="text-xs text-negro bg-dorado hover:bg-dorado-oscuro font-bold px-2.5 py-1 rounded shrink-0"
                >
                  Copiar
                </button>
              </div>
              <code className="block text-[11px] font-mono text-dorado-oscuro whitespace-pre-wrap">
                {example.code}
              </code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CustomCssEditor;
