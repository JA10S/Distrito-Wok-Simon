import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { parsePriceOptions, resolveItemVariant, getOrderLabel } from '../../utils/orderUtils';

function OrderEditor({ order, onUpdate, onCancel, onClose, canCancel = true }) {
  const { menu, loading } = useMenu();
  const [items, setItems] = useState(order.items || []);
  const [notes, setNotes] = useState(order.notes || '');
  const [activeCategory, setActiveCategory] = useState('arroces');

  useEffect(() => {
    setItems(order.items || []);
    setNotes(order.notes || '');
  }, [order]);

  const addItem = (item, variant = null) => {
    const resolved = resolveItemVariant(item, variant);
    const existingItem = items.find(i => i.id === resolved.id);
    
    if (existingItem) {
      setItems(items.map(i => 
        i.id === resolved.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, { ...resolved, quantity: 1 }]);
    }
  };

  const removeItem = (itemId) => {
    const existingItem = items.find(i => i.id === itemId);
    
    if (existingItem.quantity > 1) {
      setItems(items.map(i => 
        i.id === itemId 
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    } else {
      setItems(items.filter(i => i.id !== itemId));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.10);
  const total = subtotal + tax;

  const handleSave = () => {
    if (order.status !== 'pending') {
      alert('Solo se pueden editar pedidos pendientes (aún no han entrado en cocina)');
      return;
    }

    if (items.length === 0) {
      alert('El pedido debe tener al menos un item');
      return;
    }

    onUpdate(order.id, {
      items,
      notes: notes.trim()
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-bounce">🏮</div>
        <p className="text-dorado">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-2 rounded-lg border border-dorado-oscuro/30 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-dorado-oscuro/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-cormorant font-bold text-dorado-claro">
              Editar Pedido #{order.id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-dorado-oscuro text-sm">{getOrderLabel(order)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-dorado-oscuro hover:text-dorado"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel izquierdo: Agregar items */}
            <div>
              <h3 className="text-dorado-claro font-semibold mb-3">Agregar Items</h3>
              
              {/* Categorías */}
              <div className="flex space-x-2 mb-3 overflow-x-auto">
                {[
                  { id: 'arroces', name: 'Arroces', icon: '🍚' },
                  { id: 'corrientes', name: 'Corrientes', icon: '🍖' },
                  { id: 'porciones', name: 'Porciones', icon: '🍽️' },
                  { id: 'bebidas', name: 'Bebidas', icon: '🥤' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center space-x-1 py-1 px-3 rounded text-sm whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-dorado text-negro'
                        : 'bg-surface-3 text-dorado-oscuro hover:text-dorado'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Items del menú */}
              <div className="bg-surface-3 rounded-lg border border-dorado-oscuro/20 max-h-64 overflow-y-auto">
                {(menu[activeCategory] || [])
                  .filter(item => item.available !== false)
                  .map(item => {
                    const sizeOptions = parsePriceOptions(item.price);
                    return (
                    <div
                      key={item.id}
                      className="p-3 flex justify-between items-center gap-3 hover:bg-surface-3 border-b border-dorado-oscuro/10 last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="text-dorado-claro text-sm font-medium">{item.name}</div>
                        <div className="text-dorado text-xs">
                          {sizeOptions ? `$${sizeOptions[0].price.toLocaleString()} / $${sizeOptions[1].price.toLocaleString()}` : item.price}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {sizeOptions ? (
                          sizeOptions.map(opt => (
                            <button
                              key={opt.size}
                              onClick={() => addItem(item, opt)}
                              className="bg-surface-3 hover:bg-dorado hover:text-negro border border-dorado/50 text-dorado-claro py-1 px-2 rounded text-xs text-center leading-tight transition"
                              aria-label={`${opt.label} ${item.name}`}
                            >
                              {opt.label}
                              <span className="block font-normal opacity-80">${opt.price.toLocaleString()}</span>
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => addItem(item)}
                            className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-1 px-3 rounded text-sm"
                            aria-label={`Agregar ${item.name}`}
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>

            {/* Panel derecho: Items actuales y notas */}
            <div>
              <h3 className="text-dorado-claro font-semibold mb-3">Items Actuales</h3>
              
              {items.length === 0 ? (
                <div className="text-dorado-oscuro text-center py-4">
                  No hay items en el pedido
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-surface-3 p-2 rounded">
                      <div className="flex-1">
                        <div className="text-dorado-claro text-sm">{item.name}</div>
                        <div className="text-dorado-oscuro text-xs">
                          ${item.price.toLocaleString()} c/u
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="bg-surface-3 hover:bg-ink/10 text-dorado-claro w-6 h-6 rounded text-sm"
                        >
                          -
                        </button>
                        <span className="text-dorado-claro w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item)}
                          className="bg-surface-3 hover:bg-ink/10 text-dorado-claro w-6 h-6 rounded text-sm"
                        >
                          +
                        </button>
                        <span className="text-dorado font-bold w-20 text-right">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notas */}
              <div className="mb-4">
                <label className="block text-dorado-oscuro text-sm mb-1">
                  Notas / Instrucciones especiales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                  rows="2"
                  placeholder="Ej: Sin cebolla, poco cocido..."
                />
              </div>

              {/* Totales */}
              <div className="border-t border-dorado-oscuro/30 pt-4">
                <div className="flex justify-between text-dorado-claro mb-1">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dorado-claro mb-1">
                  <span>IVA (10%):</span>
                  <span>${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dorado font-bold text-lg">
                  <span>Total:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dorado-oscuro/30 flex justify-between">
          <div>
            {canCancel && order.status !== 'paid' && order.status !== 'cancelled' && (
              <button
                onClick={() => onCancel(order)}
                className="bg-rojo hover:bg-rojo-oscuro text-white font-bold py-2 px-4 rounded"
              >
                Cancelar Pedido
              </button>
            )}
          </div>
          
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="bg-surface-3 hover:bg-ink/10 text-dorado-claro font-bold py-2 px-4 rounded"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderEditor;
