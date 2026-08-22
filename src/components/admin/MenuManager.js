import React, { useState } from 'react';
import { useMenuAdmin } from '../../hooks/useMenuAdmin';

const COLLECTIONS = {
  arroces: { name: 'Arroces', icon: '🍚' },
  corrientes: { name: 'Corrientes', icon: '🍲' },
  porciones: { name: 'Porciones', icon: '🍽️' },
  bebidas: { name: 'Bebidas', icon: '🥤' }
};

const EMPTY_ITEM = {
  name: '',
  description: '',
  price: '',
  porciones: '',
  available: true
};

function MenuManager() {
  const { menuItems, loading, addItem, updateItem, deleteItem } = useMenuAdmin();
  const [activeCollection, setActiveCollection] = useState('arroces');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNew = () => {
    setEditingItem(null);
    setFormData(EMPTY_ITEM);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
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

  const handleDelete = async (itemId) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    
    setSaving(true);
    const result = await deleteItem(activeCollection, itemId);
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

    const itemData = {
      ...formData,
      porciones: formData.porciones || null
    };

    let result;
    if (editingItem) {
      result = await updateItem(activeCollection, editingItem.id, itemData);
    } else {
      result = await addItem(activeCollection, itemData);
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

  const items = menuItems[activeCollection] || [];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-bounce">🏮</div>
        <p className="text-dorado">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-cormorant text-dorado">Gestión del Menú</h2>
        <button
          onClick={handleNew}
          className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Tabs de colecciones */}
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
                : 'bg-gray-800 text-dorado-oscuro hover:text-dorado'
            }`}
          >
            <span>{col.icon}</span>
            <span>{col.name}</span>
            <span className="text-xs opacity-75">({(menuItems[key] || []).length})</span>
          </button>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-dorado-oscuro/30">
          <h3 className="text-lg font-cormorant text-dorado-claro mb-4">
            {editingItem ? 'Editar Producto' : 'Nuevo Producto'}
          </h3>
          
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
                  className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">Precio *</label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  placeholder="Ej: 26K / 35K"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="w-5 h-5 rounded border-dorado-oscuro bg-negro text-dorado focus:ring-dorado"
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
                className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
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
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setError('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-2 px-6 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de productos */}
      <div className="bg-gray-900 rounded-lg border border-dorado-oscuro/20">
        {items.length === 0 ? (
          <p className="text-dorado-oscuro text-center py-8">
            No hay productos en esta categoría
          </p>
        ) : (
          <div className="divide-y divide-dorado-oscuro/20">
            {items.map((item) => (
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
                    onClick={() => handleEdit(item)}
                    className="bg-gray-700 hover:bg-gray-600 text-dorado-claro px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={saving}
                    className="bg-rojo/20 hover:bg-rojo/40 text-rojo px-3 py-1 rounded text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuManager;
