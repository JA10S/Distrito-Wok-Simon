import React, { useState, useEffect } from 'react';
import { useMenuAdmin } from '../../hooks/useMenuAdmin';
import LoadingScreen from '../common/LoadingScreen';

const COLLECTIONS = {
  arroces: { name: 'Arroces', icon: '🍚' },
  corrientes: { name: 'Corrientes', icon: '🍲' },
  porciones: { name: 'Porciones', icon: '🍽️' },
  bebidas: { name: 'Bebidas', icon: '🥤' }
};

const VIEWS = [
  { id: 'productos', label: '📋 Productos' },
  { id: 'precios', label: '💲 Precios' },
  { id: 'disponibilidad', label: '✅ Disponibilidad' }
];

const EMPTY_ITEM = {
  name: '',
  description: '',
  price: '',
  porciones: '',
  available: true
};

// Quita acentos y pasa a minúsculas para buscar sin importar tildes
const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function MenuManager() {
  const { menuItems, loading, addItem, updateItem, deleteItem } = useMenuAdmin();
  const [activeView, setActiveView] = useState('productos');
  const [activeCollection, setActiveCollection] = useState('arroces');
  const [search, setSearch] = useState('');
  const [priceDrafts, setPriceDrafts] = useState({});
  const [rowSaving, setRowSaving] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setError('');
  };

  useEffect(() => {
    if (!showForm) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeForm();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showForm]);

  const handleNew = () => {
    setEditingItem(null);
    setFormData(EMPTY_ITEM);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (item, collection) => {
    setEditingItem({ ...item, collection });
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      porciones: item.porciones || '',
      available: item.available !== false
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (itemId, collection) => {
    if (!window.confirm('¿Eliminar este producto?')) return;

    setSaving(true);
    const result = await deleteItem(collection, itemId);
    setSaving(false);

    if (!result.success) {
      setError('Error al eliminar: ' + result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    setError('');

    const collection = editingItem?.collection || activeCollection;
    const itemData = {
      ...formData,
      porciones: formData.porciones || null
    };

    let result;
    if (editingItem) {
      result = await updateItem(collection, editingItem.id, itemData);
    } else {
      result = await addItem(collection, itemData);
    }

    setSaving(false);

    if (result.success) {
      setShowForm(false);
      setFormData(EMPTY_ITEM);
      setEditingItem(null);
    } else {
      setError('Error al guardar: ' + result.error);
    }
  };

  const savePrice = async (collection, item, price) => {
    const key = `${collection}:${item.id}`;
    setRowSaving(key);
    setError('');
    const result = await updateItem(collection, item.id, { price: price.trim() });
    setRowSaving(null);
    if (result.success) {
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setError('Error al guardar: ' + result.error);
    }
  };

  const toggleAvailable = async (collection, item) => {
    const key = `${collection}:${item.id}`;
    setRowSaving(key);
    setError('');
    const result = await updateItem(collection, item.id, {
      available: item.available === false
    });
    setRowSaving(null);
    if (!result.success) {
      setError('Error al actualizar disponibilidad: ' + result.error);
    }
  };

  const totalCount = Object.keys(COLLECTIONS).reduce(
    (sum, key) => sum + (menuItems[key] || []).length,
    0
  );
  const unavailableCount = Object.keys(COLLECTIONS).reduce(
    (sum, key) => sum + (menuItems[key] || []).filter((i) => i.available === false).length,
    0
  );

  const query = normalizeText(search.trim());
  const searchResults =
    query.length > 0
      ? Object.entries(COLLECTIONS).flatMap(([key, col]) =>
          (menuItems[key] || [])
            .filter(
              (item) =>
                normalizeText(item.name).includes(query) ||
                normalizeText(item.description).includes(query)
            )
            .map((item) => ({
              ...item,
              collection: key,
              categoryLabel: `${col.icon} ${col.name}`
            }))
        )
      : [];

  const items = menuItems[activeCollection] || [];

  const renderRow = (item, collection) => (
    <div key={item.id} className="p-4 flex justify-between items-center">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className="text-dorado-claro font-medium">{item.name}</span>
          {!item.available && (
            <span className="bg-rojo/20 text-rojo text-xs px-2 py-0.5 rounded">
              No disponible
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-dorado-oscuro text-sm mt-1">{item.description}</p>
        )}
        <div className="mt-1 text-sm">
          <span className="text-dorado">{item.price}</span>
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handleEdit(item, collection)}
          className="bg-surface-3 hover:bg-ink/10 text-dorado-claro px-3 py-1 rounded text-sm"
        >
          Editar
        </button>
        <button
          onClick={() => handleDelete(item.id, collection)}
          disabled={saving}
          className="bg-rojo/20 hover:bg-rojo/40 text-rojo px-3 py-1 rounded text-sm"
        >
          Eliminar
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingScreen message="Cargando menú..." fullScreen={false} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-cormorant text-dorado">Gestión del Menú</h2>
        {activeView === 'productos' && (
          <button
            onClick={handleNew}
            className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
          >
            + Nuevo Producto
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs font-inter">
        <span className="bg-surface-3 border border-dorado-oscuro/30 text-dorado-claro px-3 py-1 rounded-full">
          Total: {totalCount}
        </span>
        <span className="bg-rojo/10 border border-rojo/30 text-rojo px-3 py-1 rounded-full">
          No disponibles: {unavailableCount}
        </span>
        {Object.entries(COLLECTIONS).map(([key, col]) => (
          <span
            key={key}
            className="bg-surface-3 border border-dorado-oscuro/20 text-dorado-oscuro px-3 py-1 rounded-full"
          >
            {col.icon} {col.name}: {(menuItems[key] || []).length}
          </span>
        ))}
      </div>

      {/* Pestañas de funcionalidad */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            onClick={() => {
              setActiveView(view.id);
              setSearch('');
              setShowForm(false);
              setEditingItem(null);
            }}
            className={`py-2 px-4 rounded whitespace-nowrap ${
              activeView === view.id
                ? 'bg-dorado text-negro font-bold'
                : 'bg-surface-3 text-dorado-oscuro hover:text-dorado'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {error && !showForm && (
        <div className="bg-rojo/20 border border-rojo text-rojo px-4 py-2 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {/* ===== Vista: Productos ===== */}
      {activeView === 'productos' && (
        <>
          <div className="mb-4">
            <input
              type="search"
              aria-label="Buscar productos"
              placeholder="Buscar producto en todas las categorías..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro placeholder:text-dorado-oscuro focus:border-dorado focus:outline-none"
            />
          </div>

          {!query && (
            <div className="flex space-x-2 mb-6 overflow-x-auto">
              {Object.entries(COLLECTIONS).map(([key, col]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveCollection(key);
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className={`flex items-center space-x-2 py-2 px-4 rounded whitespace-nowrap ${
                    activeCollection === key
                      ? 'bg-dorado text-negro'
                      : 'bg-surface-3 text-dorado-oscuro hover:text-dorado'
                  }`}
                >
                  <span>{col.icon}</span>
                  <span>{col.name}</span>
                  <span className="text-xs opacity-75">({(menuItems[key] || []).length})</span>
                </button>
              ))}
            </div>
          )}

          {query ? (
            <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20">
              {searchResults.length === 0 ? (
                <p className="text-dorado-oscuro text-center py-8">
                  No se encontraron productos para "{search.trim()}"
                </p>
              ) : (
                <div className="divide-y divide-dorado-oscuro/20">
                  {searchResults.map((item) => (
                    <div key={`${item.collection}-${item.id}`}>
                      <div className="px-4 pt-3">
                        <span className="bg-surface-3 text-dorado-oscuro text-xs px-2 py-0.5 rounded-full">
                          {item.categoryLabel}
                        </span>
                      </div>
                      {renderRow(item, item.collection)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20">
              {items.length === 0 ? (
                <p className="text-dorado-oscuro text-center py-8">
                  No hay productos en esta categoría
                </p>
              ) : (
                <div className="divide-y divide-dorado-oscuro/20">
                  {items.map((item) => renderRow(item, activeCollection))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== Vista: Precios ===== */}
      {activeView === 'precios' && (
        <div>
          {Object.entries(COLLECTIONS).map(([key, col]) => {
            const rows = menuItems[key] || [];
            if (rows.length === 0) return null;
            return (
              <section key={key} className="mb-6">
                <h3 className="font-cormorant text-dorado mb-2">
                  {col.icon} {col.name}
                </h3>
                <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20 divide-y divide-dorado-oscuro/20">
                  {rows.map((item) => {
                    const draftKey = `${key}:${item.id}`;
                    const draft = priceDrafts[draftKey] ?? item.price ?? '';
                    const dirty = draft !== (item.price || '');
                    const isSaving = rowSaving === draftKey;
                    return (
                      <div key={item.id} className="p-3 flex flex-wrap items-center gap-3">
                        <span className="flex-1 text-dorado-claro min-w-[140px]">{item.name}</span>
                        <input
                          type="text"
                          aria-label={`Nuevo precio de ${item.name}`}
                          value={draft}
                          onChange={(e) =>
                            setPriceDrafts({ ...priceDrafts, [draftKey]: e.target.value })
                          }
                          placeholder="Ej: 26K / 35K"
                          className="bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-1.5 text-dorado-claro w-36 focus:border-dorado focus:outline-none"
                        />
                        <button
                          onClick={() => savePrice(key, item, draft)}
                          disabled={!dirty || !draft.trim() || isSaving}
                          className="bg-dorado hover:bg-dorado-oscuro disabled:opacity-40 text-negro font-bold px-4 py-1.5 rounded text-sm"
                        >
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ===== Vista: Disponibilidad ===== */}
      {activeView === 'disponibilidad' && (
        <div>
          {Object.entries(COLLECTIONS).map(([key, col]) => {
            const rows = menuItems[key] || [];
            if (rows.length === 0) return null;
            return (
              <section key={key} className="mb-6">
                <h3 className="font-cormorant text-dorado mb-2">
                  {col.icon} {col.name}
                </h3>
                <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/20 divide-y divide-dorado-oscuro/20">
                  {rows.map((item) => {
                    const draftKey = `${key}:${item.id}`;
                    const isSaving = rowSaving === draftKey;
                    const available = item.available !== false;
                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-dorado-claro">{item.name}</span>
                          <span className="text-dorado-oscuro text-sm ml-2">{item.price}</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0">
                          <span
                            className={`text-xs font-inter ${
                              available ? 'text-emerald-300' : 'text-rojo'
                            }`}
                          >
                            {available ? 'Disponible' : 'No disponible'}
                          </span>
                          <input
                            type="checkbox"
                            role="switch"
                            aria-label={`Disponible: ${item.name}`}
                            checked={available}
                            disabled={isSaving}
                            onChange={() => toggleAvailable(key, item)}
                            className="w-10 h-5 rounded-full accent-dorado"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-form-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeForm}
            aria-hidden="true"
          />
          <div className="relative bg-surface-3 rounded-xl border border-dorado-oscuro/40 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 id="menu-form-title" className="text-lg font-cormorant text-dorado-claro">
                {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar"
                className="text-dorado-oscuro hover:text-dorado text-xl leading-none px-2 py-1 rounded hover:bg-surface-2"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rojo/20 border border-rojo text-rojo px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dorado-oscuro text-sm mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                    placeholder="Nombre del producto"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-dorado-oscuro text-sm mb-1">Precio *</label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                    placeholder="Ej: 26K / 35K"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-5 h-5 rounded border-dorado-oscuro bg-surface-3 text-dorado focus:ring-dorado"
                    />
                    <span className="text-dorado-claro">Disponible</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface-2 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  rows="2"
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-6 rounded disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-surface-3 hover:bg-ink/10 text-dorado-claro font-bold py-2 px-6 rounded border border-dorado-oscuro/30"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuManager;
