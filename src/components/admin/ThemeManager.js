import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  COLOR_FIELDS,
  HEADING_FONTS,
  BODY_FONTS,
  applyTheme
} from '../../utils/themeUtils';

function ThemeManager() {
  const { theme, saveTheme, resetTheme } = useTheme();
  const [draft, setDraft] = useState(theme);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const savedThemeRef = useRef(theme);

  useEffect(() => {
    savedThemeRef.current = theme;
    setDraft(theme);
  }, [theme]);

  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  useEffect(() => () => {
    applyTheme(savedThemeRef.current);
  }, []);

  const setColor = (key, value) => {
    setDraft((current) => ({
      ...current,
      colors: { ...current.colors, [key]: value }
    }));
    setStatus('');
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    const result = await saveTheme(draft);
    setSaving(false);
    setStatus(result.success ? 'saved' : 'error');
  };

  const handleReset = async () => {
    if (!window.confirm('¿Restaurar los colores y fuentes originales del restaurante?')) return;
    const result = await resetTheme();
    setStatus(result.success ? 'reset' : 'error');
  };

  return (
    <div>
      <h2 className="text-xl font-cormorant text-dorado mb-6">Apariencia de las Páginas</h2>
      <p className="text-dorado-oscuro text-sm mb-6">
        Los cambios se aplican en vivo a todas las páginas (menú, login y dashboards).
        Sin guardar, se descartan al salir de esta sección.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colores */}
        <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
          <h3 className="text-lg font-cormorant text-dorado mb-4">Colores</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOR_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center space-x-3">
                <input
                  type="color"
                  aria-label={field.label}
                  value={draft.colors[field.key]}
                  onChange={(e) => setColor(field.key, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border border-dorado-oscuro/40 bg-transparent"
                />
                <div>
                  <div className="text-dorado-claro text-sm">{field.label}</div>
                  <div className="text-dorado-oscuro text-xs uppercase">{draft.colors[field.key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de letra */}
        <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
          <h3 className="text-lg font-cormorant text-dorado mb-4">Tipos de Letra</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-dorado-oscuro text-sm mb-1" htmlFor="heading-font">
                Títulos y encabezados
              </label>
              <select
                id="heading-font"
                value={draft.headingFont}
                onChange={(e) => { setDraft({ ...draft, headingFont: e.target.value }); setStatus(''); }}
                className="w-full bg-gray-800 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
              >
                {HEADING_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-dorado-oscuro text-sm mb-1" htmlFor="body-font">
                Texto del cuerpo
              </label>
              <select
                id="body-font"
                value={draft.bodyFont}
                onChange={(e) => { setDraft({ ...draft, bodyFont: e.target.value }); setStatus(''); }}
                className="w-full bg-gray-800 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
              >
                {BODY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vista previa */}
          <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-dorado-oscuro/20">
            <h4 className="font-cormorant text-2xl font-bold text-dorado-claro">Título de ejemplo</h4>
            <p className="text-dorado-oscuro text-sm mt-1">
              Texto de ejemplo con la tipografía del cuerpo seleccionada.
            </p>
            <div className="flex space-x-2 mt-3">
              <span className="bg-dorado text-negro text-xs font-bold py-1 px-3 rounded">Dorado</span>
              <span className="bg-rojo text-white text-xs font-bold py-1 px-3 rounded">Rojo</span>
              <span className="border border-dorado-oscuro text-dorado-claro text-xs py-1 px-3 rounded">Borde</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-6 rounded disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-2 px-6 rounded"
        >
          Restaurar por defecto
        </button>
        {status === 'saved' && (
          <span className="text-green-500 text-sm">✓ Guardado — ya se aplica en todas las páginas</span>
        )}
        {status === 'reset' && (
          <span className="text-dorado text-sm">✓ Valores originales restaurados</span>
        )}
        {status === 'error' && (
          <span className="text-rojo text-sm">Error al guardar, intente de nuevo</span>
        )}
      </div>
    </div>
  );
}

export default ThemeManager;
