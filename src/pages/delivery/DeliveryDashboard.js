import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function DeliveryDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('available');

  // Datos de ejemplo para pedidos de domicilio
  const deliveryOrders = [
    {
      id: 101,
      customer: 'Juan Pérez',
      phone: '+573001234567',
      address: 'Calle 45 #12-34, Barranquilla',
      items: [
        { name: 'Arroz Oriental Wok', quantity: 1, price: 47000 },
        { name: 'Arroz Criollo Wok', quantity: 1, price: 37000 },
      ],
      total: 84000,
      status: 'pending',
      notes: 'Sin cebolla en el arroz oriental',
    },
    {
      id: 102,
      customer: 'María García',
      phone: '+573009876543',
      address: 'Carrera 50 #20-15, Barranquilla',
      items: [
        { name: 'Arroz Parrillada Wok', quantity: 2, price: 37000 },
        { name: 'Coca-Cola 1.5LT', quantity: 1, price: 8000 },
      ],
      total: 82000,
      status: 'ready',
      notes: '',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-600';
      case 'ready':
        return 'bg-green-600';
      case 'delivering':
        return 'bg-blue-600';
      case 'delivered':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'ready':
        return 'Listo para Recoger';
      case 'delivering':
        return 'En Camino';
      case 'delivered':
        return 'Entregado';
      default:
        return 'Desconocido';
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    alert(`Pedido #${orderId} actualizado a: ${getStatusText(newStatus)}`);
  };

  return (
    <div className="min-h-screen bg-negro">
      {/* Header */}
      <header className="bg-gray-900 border-b border-dorado-oscuro/30 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="font-cormorant text-2xl font-bold text-dorado-claro">
              Panel del Domiciliario
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
              onClick={() => setActiveTab('available')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'available'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos Disponibles
            </button>
            <button
              onClick={() => setActiveTab('my deliveries')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'my deliveries'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Mis Entregas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'history'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Historial
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'available' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos Disponibles</h2>
            
            {deliveryOrders.filter((o) => o.status === 'ready').length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No hay pedidos disponibles para recoger
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {deliveryOrders
                  .filter((order) => order.status === 'ready')
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                            Pedido #{order.id}
                          </h3>
                          <p className="text-dorado-oscuro text-sm">
                            {order.customer}
                          </p>
                        </div>
                        <span className={`text-white px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-dorado-claro">
                            <span>
                              {item.quantity}x {item.name}
                            </span>
                            <span>${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-dorado-oscuro/30 pt-4 mb-4">
                        <div className="flex justify-between text-dorado font-bold text-xl">
                          <span>Total:</span>
                          <span>${order.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="text-dorado-claro">
                          <span className="font-semibold">Dirección:</span> {order.address}
                        </div>
                        <div className="text-dorado-claro">
                          <span className="font-semibold">Teléfono:</span> {order.phone}
                        </div>
                        {order.notes && (
                          <div className="text-yellow-400">
                            <span className="font-semibold">Notas:</span> {order.notes}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleStatusChange(order.id, 'delivering')}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
                      >
                        Recoger Pedido
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my deliveries' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Mis Entregas Activas</h2>
            
            {deliveryOrders.filter((o) => o.status === 'delivering').length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No tienes entregas activas en este momento
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {deliveryOrders
                  .filter((order) => order.status === 'delivering')
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
                            Pedido #{order.id}
                          </h3>
                          <p className="text-dorado-oscuro text-sm">
                            {order.customer}
                          </p>
                        </div>
                        <span className={`text-white px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="text-dorado-claro">
                          <span className="font-semibold">Dirección:</span> {order.address}
                        </div>
                        <div className="text-dorado-claro">
                          <span className="font-semibold">Teléfono:</span> {order.phone}
                        </div>
                        <div className="text-dorado font-bold text-xl">
                          Total: ${order.total.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleStatusChange(order.id, 'delivered')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                      >
                        Marcar como Entregado
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Historial de Entregas</h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                Historial de entregas realizadas
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryDashboard;