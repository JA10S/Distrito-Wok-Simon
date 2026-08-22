import React, { useState } from 'react';
import { useMenu } from '../../hooks/useMenu';

const CATEGORIES = [
  { id: 'arroces', name: 'Arroces', icon: '🍚' },
  { id: 'corrientes', name: 'Corrientes', icon: '🍖' },
  { id: 'porciones', name: 'Porciones', icon: '🍽️' },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤' }
];

function OrderCreator({ tables, selectedTable, onTableSelect, onConfirmOrder }) {
  const { menu, loading } = useMenu();
  const [activeCategory, setActiveCategory] = useState('arroces');
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState('');

  const addItem = (item) => {
    const existingItem = orderItems.find(i => i.id === item.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(i => 
        i.id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setOrderItems([...orderItems, {
        id: item.id,
        name: item.name,
        price: parsePrice(item.price),
        quantity: 1
      }]);
    }
  };

  const removeItem = (itemId) => {
    const existingItem = orderItems.find(i => i.id === itemId);
    
    if (existingItem.quantity > 1) {
      setOrderItems(orderItems.map(i => 
        i.id === itemId 
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ));
    } else {
      setOrderItems(orderItems.filter(i => i.id !== itemId));
    }
  };

  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const match = priceStr.match(/(\d+)/);
    return match ? parseInt(match[1]) * 1000 : 0;
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.10);
  const total = subtotal + tax;

  const handleConfirm = () => {
    if (!selectedTable) {
      alert('Seleccione una mesa');
      return;
    }
    
    if (orderItems.length === 0) {
      alert('Agregue al menos un item al pedido');
      return;
    }

    onConfirmOrder({
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      items: orderItems,
      notes: notes.trim(),
      subtotal,
      tax,
      total
    });

    setOrderItems([]);
    setNotes('');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel izquierdo: Selección de mesa y menú */}
      <div className="lg:col-span-2">
        {/* Selección de mesa */}
        <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 mb-4">
          <label className="block text-dorado-claro text-sm mb-2">
            Seleccionar Mesa
          </label>
          <div className="grid grid-cols-4 gap-2">
            {tables
              .filter(t => t.status === 'available')
              .map(table => (
                <button
                  key={table.id}
                  onClick={() => onTableSelect(table)}
                  className={`p-3 rounded-lg border-2 transition ${
                    selectedTable?.id === table.id
                      ? 'border-dorado bg-dorado/20'
                      : 'border-dorado-oscuro/30 bg-gray-800 hover:border-dorado/50'
                  }`}
                >
                  <div className="text-dorado-claro font-bold">{table.number}</div>
                  <div className="text-dorado-oscuro text-xs">{table.capacity} pers.</div>
                </button>
              ))}
          </div>
          {tables.filter(t => t.status === 'available').length === 0 && (
            <p className="text-dorado-oscuro text-sm mt-2">No hay mesas disponibles</p>
          )}
        </div>

        {/* Categorías */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-2 py-2 px-4 rounded whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-dorado text-negro'
                  : 'bg-gray-800 text-dorado-oscuro hover:text-dorado'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Items del menú */}
        <div className="bg-gray-900 rounded-lg border border-dorado-oscuro/20">
          <div className="divide-y divide-dorado-oscuro/20 max-h-96 overflow-y-auto">
            {(menu[activeCategory] || [])
              .filter(item => item.available !== false)
              .map(item => (
                <div
                  key={item.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-800/50"
                >
                  <div className="flex-1">
                    <div className="text-dorado-claro font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-dorado-oscuro text-sm">{item.description}</div>
                    )}
                    <div className="text-dorado font-bold mt-1">{item.price}</div>
                  </div>
                  <button
                    onClick={() => addItem(item)}
                    className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
                  >
                    +
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Panel derecho: Resumen del pedido */}
      <div className="lg:col-span-1">
        <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20 sticky top-4">
          <h3 className="font-cormorant text-xl font-bold text-dorado-claro mb-4">
            Resumen del Pedido
          </h3>

          {selectedTable ? (
            <div className="text-dorado-claro mb-4">
              Mesa: <span className="font-bold">{selectedTable.number}</span>
            </div>
          ) : (
            <div className="text-dorado-oscuro mb-4">Sin mesa seleccionada</div>
          )}

          {orderItems.length === 0 ? (
            <div className="text-dorado-oscuro text-center py-8">
              Agregue items del menú
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {orderItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-dorado-claro text-sm">{item.name}</div>
                      <div className="text-dorado-oscuro text-xs">
                        ${item.price.toLocaleString()} c/u
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-gray-700 hover:bg-gray-600 text-dorado-claro w-6 h-6 rounded text-sm"
                      >
                        -
                      </button>
                      <span className="text-dorado-claro w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addItem(item)}
                        className="bg-gray-700 hover:bg-gray-600 text-dorado-claro w-6 h-6 rounded text-sm"
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

              {/* Campo de notas */}
              <div className="mb-4">
                <label className="block text-dorado-oscuro text-sm mb-1">
                  Notas / Instrucciones especiales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-800 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                  rows="2"
                  placeholder="Ej: Sin cebolla, poco cocido, extra salsa..."
                />
              </div>

              <div className="border-t border-dorado-oscuro/30 pt-4">
                <div className="flex justify-between text-dorado-claro mb-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dorado-claro mb-2">
                  <span>IVA (10%):</span>
                  <span>${tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-dorado font-bold text-xl">
                  <span>Total:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!selectedTable}
                className="w-full mt-4 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                Crear Pedido
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderCreator;
