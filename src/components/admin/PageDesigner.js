import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMenuLayout } from '../../hooks/useMenuLayout';
import { useMenu } from '../../hooks/useMenu';
import { useTheme } from '../../contexts/ThemeContext';
import {
  sanitizeLayout,
  BLOCK_KIND_LABELS,
  BLOCK_TEXT_FIELDS,
  SECTION_ICONS,
  SECTION_COLUMNS,
  sectionGridClass
} from '../../utils/layoutUtils';
import SiteHeader from '../client/SiteHeader';
import SiteFooter from '../client/SiteFooter';
import { FaGripVertical, FaEye, FaEyeSlash, FaPen, FaChevronUp, FaChevronDown } from 'react-icons/fa';

function blockName(block) {
  if (block.kind === 'category') return `${block.emoji} ${block.label}`.trim();
  return BLOCK_KIND_LABELS[block.kind] || block.id;
}

function BlockRow({
  block,
  index,
  total,
  expanded,
  onExpand,
  onFieldChange,
  onToggleVisible,
  onMove
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const name = blockName(block);
  const fields = BLOCK_TEXT_FIELDS[block.kind] || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-3 border rounded-lg mb-2 ${
        isDragging ? 'border-dorado shadow-lg' : 'border-dorado-oscuro/25'
      }`}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button
          type="button"
          aria-label={`Reordenar ${name}`}
          className="cursor-grab touch-none text-dorado-oscuro hover:text-dorado px-1"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical aria-hidden="true" />
        </button>

        <span className="flex-1 min-w-0 truncate text-sm text-dorado-claro">
          {name}
          <span className="ml-2 text-[10px] uppercase tracking-wider bg-surface-2 border border-dorado-oscuro/30 text-dorado-oscuro px-1.5 py-0.5 rounded">
            {BLOCK_KIND_LABELS[block.kind]}
          </span>
        </span>

        <button
          type="button"
          aria-label={`Subir ${name}`}
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          className="p-1.5 text-dorado-oscuro hover:text-dorado disabled:opacity-30"
        >
          <FaChevronUp aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Bajar ${name}`}
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          className="p-1.5 text-dorado-oscuro hover:text-dorado disabled:opacity-30"
        >
          <FaChevronDown aria-hidden="true" />
        </button>

        <label
          className="flex items-center gap-1.5 cursor-pointer shrink-0"
          title={block.visible ? 'Visible en la página' : 'Oculto de la página'}
        >
          <span className={`text-xs ${block.visible ? 'text-emerald-300' : 'text-rojo'}`}>
            {block.visible ? <FaEye aria-hidden="true" /> : <FaEyeSlash aria-hidden="true" />}
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-label={`Visible: ${name}`}
            checked={block.visible !== false}
            onChange={() => onToggleVisible(block.id)}
            className="w-9 h-5 rounded-full accent-dorado"
          />
        </label>

        <button
          type="button"
          aria-label={`Editar textos: ${name}`}
          onClick={() => onExpand(expanded ? null : block.id)}
          className={`p-1.5 rounded ${
            expanded
              ? 'bg-dorado text-negro'
              : 'text-dorado-oscuro hover:text-dorado hover:bg-surface-2'
          }`}
        >
          <FaPen aria-hidden="true" />
        </button>
      </div>

      {expanded && (fields.length > 0 || block.kind === 'category') && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-dorado-oscuro/20">
          {fields.map((field) => (
            <label key={field.key} className="text-xs text-dorado-oscuro">
              {field.label}
              <input
                type="text"
                aria-label={`${name}: ${field.label}`}
                value={block[field.key] || ''}
                onChange={(e) => onFieldChange(block.id, field.key, e.target.value)}
                className="mt-1 w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-2 py-1.5 text-sm text-dorado-claro focus:border-dorado focus:outline-none"
              />
            </label>
          ))}
          {block.kind === 'category' && (
            <label className="text-xs text-dorado-oscuro">
              Columnas de las tarjetas
              <select
                aria-label={`${name}: Columnas`}
                value={block.columns || 'auto'}
                onChange={(e) => onFieldChange(block.id, 'columns', e.target.value)}
                className="mt-1 w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-2 py-1.5 text-sm text-dorado-claro focus:border-dorado focus:outline-none"
              >
                {Object.entries(SECTION_COLUMNS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function MenuPreview({ draft, device }) {
  const { menu, loading } = useMenu();
  const { theme } = useTheme();
  const themeLayout = (theme && theme.layout) || 'clasic';

  const hero = draft.blocks.find((b) => b.kind === 'hero');
  const footer = draft.blocks.find((b) => b.kind === 'footer');
  const sections = draft.blocks
    .filter((b) => b.kind === 'category' && b.visible !== false)
    .map((b) => ({
      id: b.id,
      key: b.id,
      emoji: b.emoji,
      label: b.label,
      title: b.title,
      subtitle: b.subtitle || null,
      columns: b.columns || 'auto',
      icon: SECTION_ICONS[b.id] || null
    }));

  return (
    <div
      className={`mx-auto bg-surface border border-dorado-oscuro/30 rounded-xl overflow-hidden ${
        device === 'mobile' ? 'w-[375px] max-w-full' : 'w-full'
      }`}
      aria-label="Vista previa del menú"
    >
      <SiteHeader
        layout={themeLayout}
        sections={sections}
        showHero={!hero || hero.visible !== false}
        heroTitle={hero && hero.title}
        heroSlogan={hero && hero.slogan}
      />

      <div className="px-4 py-6">
        {loading && (
          <p className="text-dorado-oscuro text-sm text-center py-4">Cargando productos…</p>
        )}
        {sections.map((section) => {
          const items = (menu[section.key] || []).filter(
            (item) => item.available !== false
          );

          return (
            <section key={section.id} id={`preview-${section.id}`} className="mb-8">
              <div className="text-center mb-4">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-dorado/10 border border-dorado/30 text-dorado text-xl mb-2 glow" aria-hidden="true">
                  {section.icon}
                </span>
                <h2 className="font-cormorant text-2xl font-semibold text-dorado">
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-dorado-oscuro italic text-xs mt-1">
                    {section.subtitle}
                  </p>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-dorado-oscuro text-xs text-center py-2">
                  Sin productos disponibles
                </p>
              ) : (
                <div className={`grid gap-2 ${sectionGridClass(section.columns, themeLayout)}`}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-surface-2 rounded-lg p-3 border border-dorado-oscuro/20"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-cormorant text-sm font-bold text-dorado-claro">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-ink text-[11px] italic mt-0.5 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-dorado font-semibold text-xs">
                            {item.price}
                          </div>
                          <span className="mt-1 inline-block bg-dorado text-negro font-bold py-0.5 px-2 rounded text-[10px] opacity-70">
                            ＋ Agregar
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {(!footer || footer.visible !== false) && <SiteFooter config={footer} />}
    </div>
  );
}

function LoginPreview({ device }) {
  return (
    <div
      className={`mx-auto bg-negro border border-dorado-oscuro/30 rounded-xl overflow-hidden ${
        device === 'mobile' ? 'w-[375px] max-w-full' : 'w-full'
      }`}
      aria-label="Vista previa del login"
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative h-40 md:h-72 surface-dark bg-negro flex flex-col items-center justify-center gap-2 border-r border-dorado/10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-60"
            style={{ backgroundImage: 'url(/assets/images/login-chef.jpg)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
          <div className="relative text-center px-4">
            <p className="font-cormorant text-2xl md:text-3xl font-bold text-gold-gradient">
              Distrito Wok Simón
            </p>
            <p className="text-dorado-oscuro text-[11px] tracking-[0.4em] mt-1">
              * SABOR QUE ENAMORA *
            </p>
          </div>
        </div>

        <div className="p-5 md:p-8">
          <div className="bg-surface-2/85 border border-dorado-oscuro/25 rounded-xl p-4 md:p-5">
            <h3 className="font-cormorant text-xl font-bold text-dorado mb-1 text-center">
              Iniciar Sesión
            </h3>
            <p className="text-dorado-oscuro text-[11px] text-center mb-4">
              Acceso para el personal y clientes
            </p>
            <div className="space-y-3">
              <div className="bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-xs text-dorado-oscuro">
                Correo electrónico
              </div>
              <div className="bg-surface-3 border border-dorado-oscuro/30 rounded-lg px-3 py-2 text-xs text-dorado-oscuro">
                Contraseña
              </div>
              <div className="btn-gold text-center text-xs font-bold py-2 rounded-xl">
                Ingresar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageDesigner() {
  const { layout, saveLayout, resetLayout } = useMenuLayout();
  const [draft, setDraft] = useState(() => sanitizeLayout(layout));
  const [expandedId, setExpandedId] = useState(null);
  const [device, setDevice] = useState('mobile');
  const [previewTab, setPreviewTab] = useState('menu');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(layout);

  useEffect(() => {
    savedRef.current = layout;
    setDraft(sanitizeLayout(layout));
  }, [layout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const dirty =
    JSON.stringify(draft) !== JSON.stringify(sanitizeLayout(savedRef.current));

  const updateBlock = (id, patch) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, ...patch } : block
      )
    }));
    setStatus('');
  };

  const toggleVisible = (id) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? { ...block, visible: block.visible === false } : block
      )
    }));
    setStatus('');
  };

  const move = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= draft.blocks.length) return;
    setDraft((current) => ({
      ...current,
      blocks: arrayMove(current.blocks, fromIndex, toIndex)
    }));
    setStatus('');
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const fromIndex = draft.blocks.findIndex((b) => b.id === active.id);
    const toIndex = draft.blocks.findIndex((b) => b.id === over.id);
    if (fromIndex < 0 || toIndex < 0) return;
    setDraft((current) => ({
      ...current,
      blocks: arrayMove(current.blocks, fromIndex, toIndex)
    }));
    setStatus('');
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    const result = await saveLayout(draft);
    setSaving(false);
    setStatus(result && result.success ? 'saved' : 'error');
  };

  const handleReset = async () => {
    if (!window.confirm('¿Restaurar el diseño por defecto de la página?')) return;
    const result = await resetLayout();
    setStatus(result && result.success ? 'reset' : 'error');
  };

  const dirtyNote = useMemo(() => (dirty ? 'Cambios sin guardar' : ''), [dirty]);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-cormorant text-dorado-claro">Diseño de la Página</h3>
        <p className="text-dorado-oscuro text-sm">
          Arrastra los bloques para reordenar la página, oculta los que no quieras y
          edita sus textos. La vista previa se actualiza mientras editas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ===== Lista de bloques ===== */}
        <div>
          <p className="text-dorado-oscuro text-xs font-inter mb-2">
            Bloques de la página (arriba = primero en la página)
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draft.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div>
                {draft.blocks.map((block, index) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    index={index}
                    total={draft.blocks.length}
                    expanded={expandedId === block.id}
                    onExpand={setExpandedId}
                    onFieldChange={(id, field, value) => updateBlock(id, { [field]: value })}
                    onToggleVisible={toggleVisible}
                    onMove={move}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-dorado hover:bg-dorado-oscuro disabled:opacity-40 text-negro font-bold py-2 px-5 rounded"
            >
              {saving ? 'Guardando...' : 'Guardar diseño'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-surface-3 hover:bg-ink/10 text-dorado-claro font-bold py-2 px-4 rounded border border-dorado-oscuro/30"
            >
              Restaurar por defecto
            </button>
            {dirtyNote && (
              <span className="text-amber-300 text-sm font-inter" role="status">
                {dirtyNote}
              </span>
            )}
            {status === 'saved' && (
              <span className="text-emerald-300 text-sm font-inter" role="status">
                ✓ Diseño guardado
              </span>
            )}
            {status === 'reset' && (
              <span className="text-dorado text-sm font-inter" role="status">
                ✓ Diseño restaurado
              </span>
            )}
            {status === 'error' && (
              <span className="text-rojo text-sm font-inter" role="status">
                Error al guardar
              </span>
            )}
          </div>
        </div>

        {/* ===== Vista previa ===== */}
        <div className="lg:sticky lg:top-24">
          <div className="bg-surface-2 border border-dorado-oscuro/25 rounded-xl p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex space-x-1 bg-surface-3 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab('menu')}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${
                    previewTab === 'menu'
                      ? 'bg-dorado text-negro'
                      : 'text-dorado-oscuro hover:text-dorado'
                  }`}
                >
                  🏮 Menú
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('login')}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${
                    previewTab === 'login'
                      ? 'bg-dorado text-negro'
                      : 'text-dorado-oscuro hover:text-dorado'
                  }`}
                >
                  🔐 Login
                </button>
              </div>

              <div className="flex space-x-1 bg-surface-3 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${
                    device === 'mobile'
                      ? 'bg-dorado text-negro'
                      : 'text-dorado-oscuro hover:text-dorado'
                  }`}
                >
                  📱
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  className={`px-3 py-1.5 rounded text-xs font-bold ${
                    device === 'desktop'
                      ? 'bg-dorado text-negro'
                      : 'text-dorado-oscuro hover:text-dorado'
                  }`}
                >
                  🖥️
                </button>
              </div>
            </div>

            <div className="bg-surface border border-dorado-oscuro/20 rounded-lg p-3 max-h-[600px] overflow-y-auto">
              {previewTab === 'menu' ? (
                <MenuPreview draft={draft} device={device} />
              ) : (
                <LoginPreview device={device} />
              )}
            </div>

            <p className="text-dorado-oscuro text-[11px] mt-2 text-center">
              Vista previa con los colores y tipografías actuales · cambios no guardados no
              afectan la página real
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageDesigner;
