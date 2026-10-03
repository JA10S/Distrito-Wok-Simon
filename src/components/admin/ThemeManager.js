import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  COLOR_FIELDS,
  HEADING_FONTS,
  BODY_FONTS,
  PRESETS,
  MODES,
  LAYOUTS,
  RADII,
  getPalette,
  applyTheme
} from '../../utils/themeUtils';

function optionButton(active, extraClass = '') {
  return `text-left rounded-lg p-3 border-2 transition cursor-pointer ${
    active
      ? 'border-dorado bg-dorado/10 shadow-[0_0_0_1px_rgb(var(--color-dorado)/0.4)]'
      : 'border-dorado-oscuro/30 bg-surface-3 hover:border-dorado/60'
  } ${extraClass}`;
}

function ThemeManager() {
  const { theme, saveTheme, resetTheme, setLocalMode } = useTheme();
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

  const update = (patch) => {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus('');
  };

  const setColor = (key, value) => {
    setDraft((current) => ({
      ...current,
      colors: { ...current.colors, [key]: value }
    }));
    setStatus('');
  };

  const modeOf = (value) => (value === 'light' ? 'light' : 'dark');

  const selectPreset = (presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    update({
      preset: presetId,
      colors: getPalette(presetId, modeOf(draft.mode)),
      ...(preset && preset.fonts ? preset.fonts : {})
    });
  };

  const selectMode = (modeId) => {
    update({
      mode: modeId,
      colors: getPalette(draft.preset, modeOf(modeId))
    });
    if (typeof setLocalMode === 'function') setLocalMode(modeId);
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

  const accentFields = COLOR_FIELDS.filter((field) => field.group === 'accent');
  const surfaceFields = COLOR_FIELDS.filter((field) => field.group === 'surface');

  const renderColorFields = (fields) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => (
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
  );

  return (
    <div>
      <h2 className="text-xl font-cormorant text-dorado mb-6">Apariencia de las Páginas</h2>
      <p className="text-dorado-oscuro text-sm mb-6">
        Los cambios se aplican en vivo a todas las páginas (menú, login y dashboards).
        Sin guardar, se descartan al salir de esta sección.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estilos (presets) */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 lg:col-span-2">
          <h3 className="text-lg font-cormorant text-dorado mb-1">Estilos</h3>
          <p className="text-dorado-oscuro text-xs mb-4">
            Paletas completas. Al elegir una se actualizan colores y tipografías.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRESETS.map((preset) => {
              const active = draft.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  aria-pressed={active}
                  className={optionButton(active)}
                >
                  <span className="flex gap-1.5 mb-2" aria-hidden="true">
                    {[preset.dark.dorado, preset.dark.rojo, preset.dark.surface, preset.light.surface].map((color, index) => (
                      <span
                        key={`${preset.id}-${index}`}
                        className="w-5 h-5 rounded border border-black/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="block font-cormorant text-lg text-dorado-claro">{preset.name}</span>
                  <span className="block text-dorado-oscuro text-xs mt-1">{preset.description}</span>
                  {active && <span className="block text-dorado text-xs mt-2 font-semibold">✓ Seleccionado</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modo */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
          <h3 className="text-lg font-cormorant text-dorado mb-1">Modo</h3>
          <p className="text-dorado-oscuro text-xs mb-4">
            Los visitantes pueden cambiarlo desde el botón 🌙 / ☀ y su elección tiene prioridad.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((mode) => {
              const active = draft.mode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => selectMode(mode.id)}
                  aria-pressed={active}
                  className={`${optionButton(active)} text-center`}
                >
                  <span className="block text-xl" aria-hidden="true">{mode.icon}</span>
                  <span className="block text-dorado-claro text-sm font-semibold mt-1">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Disposición del menú */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
          <h3 className="text-lg font-cormorant text-dorado mb-1">Disposición del menú</h3>
          <p className="text-dorado-oscuro text-xs mb-4">
            Cómo se navega el menú público y las secciones de los paneles.
          </p>
          <div className="space-y-3">
            {LAYOUTS.map((item) => {
              const active = draft.layout === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ layout: item.id })}
                  aria-pressed={active}
                  className={`${optionButton(active, 'w-full flex items-start gap-3')}`}
                >
                  <span className="mt-0.5 text-dorado" aria-hidden="true">
                    {item.id === 'clasic' ? '☰≡' : item.id === 'hamburger' ? '☰' : '◧'}
                  </span>
                  <span>
                    <span className="block text-dorado-claro text-sm font-semibold">{item.label}</span>
                    <span className="block text-dorado-oscuro text-xs mt-0.5">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Esquinas */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
          <h3 className="text-lg font-cormorant text-dorado mb-1">Esquinas</h3>
          <p className="text-dorado-oscuro text-xs mb-4">Redondeado de botones, tarjetas y campos.</p>
          <div className="grid grid-cols-3 gap-3">
            {RADII.map((item) => {
              const active = draft.radius === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => update({ radius: item.id })}
                  aria-pressed={active}
                  className={`${optionButton(active)} text-center`}
                >
                  <span
                    className="block w-8 h-8 mx-auto mb-2 border-2 border-dorado bg-dorado/20"
                    aria-hidden="true"
                    style={{
                      borderRadius: item.id === 'sm' ? '2px' : item.id === 'md' ? '8px' : '18px'
                    }}
                  />
                  <span className="block text-dorado-claro text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colores */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 lg:col-span-2">
          <h3 className="text-lg font-cormorant text-dorado mb-4">Colores</h3>

          <h4 className="text-dorado-claro text-sm font-semibold mb-3">Acentos</h4>
          <div className="mb-6">{renderColorFields(accentFields)}</div>

          <h4 className="text-dorado-claro text-sm font-semibold mb-3">Superficies y texto</h4>
          {renderColorFields(surfaceFields)}
        </div>

        {/* Tipos de letra */}
        <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 lg:col-span-2">
          <h3 className="text-lg font-cormorant text-dorado mb-4">Tipos de Letra</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-dorado-oscuro text-sm mb-1" htmlFor="heading-font">
                Títulos y encabezados
              </label>
              <select
                id="heading-font"
                value={draft.headingFont}
                onChange={(e) => update({ headingFont: e.target.value })}
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
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
                onChange={(e) => update({ bodyFont: e.target.value })}
                className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
              >
                {BODY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>{font.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Vista previa */}
          <div className="mt-6 bg-surface-3 rounded-lg p-4 border border-dorado-oscuro/20">
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
      <div className="flex items-center space-x-4 mt-6 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-6 rounded disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={handleReset}
          className="bg-surface-3 hover:bg-ink/10 text-dorado-claro font-bold py-2 px-6 rounded"
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
