import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function WaiterDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tables');

  // Datos de ejemplo para las mesas
  const tables = [
    { id: 1, number: 1, capacity: 4, status: 'available' },
    { id: 2, number: 2, capacity: 4, status: 'occupied' },
    { id: 3, number: 3, capacity: 2, status: 'available' },
    { id: 4, number: 4, capacity: 6, status: 'reserved' },
    { id: 5, number: 5, capacity: 4, status: 'available' },
    { id: 6, number: 6, capacity: 4, status: 'occupied' },
    { id: 7, number: 7, capacity: 2, status: 'available' },
    { id: 8, number: 8, capacity: 8, status: 'available' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-600';
      case 'occupied':
        return 'bg-red-600';
      case 'reserved':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-negro">
      {/* Header */}
      <header className="bg-gray-900 border-b border-dorado-oscuro/30 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="font-cormorant text-2xl font-bold text-dorado-claro">
              Panel del Camarero
            </h1>
            <p className="text-dorado-oscuro text-sm">
              Bienvenido, {currentUser?.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-rojo hover:bg-rojo-oscuro text-white px-4 py-2 rounded"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Navegación */}
      <nav className="bg-gray-800 border-b border-dorado-oscuro/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('tables')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'tables'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Mesas
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'orders'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos Activos
            </button>
            <button
              onClick={() => setActiveTab('new-order')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'new-order'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Nuevo Pedido
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'tables' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Estado de Mesas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`rounded-lg p-4 border-2 ${
                    table.status === 'available'
                      ? 'border-green-500 bg-green-900/30'
                      : table.status === 'occupied'
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-yellow-500 bg-yellow-900/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-dorado-claro">
                      Mesa {table.number}
                    </div>
                    <div className="text-sm text-dorado-oscuro mt-1">
                      Capacidad: {table.capacity} personas
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${getStatusColor(table.status)}`}>
                      {getStatusText(table.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos Activos</h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                No hay pedidos activos en este momento
              </p>
            </div>
          </div>
        )}

        {activeTab === 'new-order' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Nuevo Pedido</h2>
            <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
              <div className="mb-4">
                <label className="block text-dorado-claro text-sm mb-2">
                  Seleccionar Mesa
                </label>
                <select className="w-full bg-negro border border-dorado-oscuro rounded px-4 py-3 text-dorado-claro">
                  <option value="">Seleccionar mesa...</option>
                  {tables
                    .filter((t) => t.status === 'available')
                    .map((table) => (
                      <option key={table.id} value={table.number}>
                        Mesa {table.number} ({table.capacity} personas)
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="text-center text-dorado-oscuro">
                Seleccione una mesa para comenzar el pedido
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default WaiterDashboard;