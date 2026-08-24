import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDeliveries } from '../../hooks/useDeliveries';

function DeliveryDashboard() {
  const { currentUser, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available');

  const { deliveries, loading, error, takeDelivery, markDelivered } = useDeliveries();

  const availableDeliveries = deliveries.filter((d) => d.status === 'ready');
  const myDeliveries = deliveries.filter(
    (d) => d.status === 'delivering' && d.assignedTo === currentUser?.uid
  );
  const historyDeliveries = deliveries.filter((d) => d.status === 'delivered');

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

  const handleTakeDelivery = async (deliveryId) => {
    const result = await takeDelivery(deliveryId, currentUser.uid, currentUser.email);
    if (result.success) {
      alert('Pedido asignado a tus entregas');
    } else {
      alert('Error al asignar pedido: ' + result.error);
    }
  };

  const handleMarkDelivered = async (deliveryId) => {
    const result = await markDelivered(deliveryId);
    if (result.success) {
      alert('Entrega marcada como entregada');
    } else {
      alert('Error al marcar entrega: ' + result.error);
    }
  };

  const DeliveryCard = ({ delivery, action }) => (
    <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-cormorant text-xl font-bold text-dorado-claro">
            Pedido #{delivery.id.slice(-6).toUpperCase()}
          </h3>
          <p className="text-dorado-oscuro text-sm">{delivery.customer}</p>
        </div>
        <span className={`text-white px-3 py-1 rounded-full text-sm ${getStatusColor(delivery.status)}`}>
          {getStatusText(delivery.status)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {(delivery.items || []).map((item, index) => (
          <div key={index} className="flex justify-between text-dorado-claro">
            <span>{item.quantity}x {item.name}</span>
            <span>${(item.price * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dorado-oscuro/30 pt-4 mb-4">
        <div className="flex justify-between text-dorado font-bold text-xl">
          <span>Total:</span>
          <span>${(delivery.total || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-dorado-claro">
          <span className="font-semibold">Dirección:</span> {delivery.address}
        </div>
        <div className="text-dorado-claro">
          <span className="font-semibold">Teléfono:</span> {delivery.phone}
        </div>
        {delivery.assignedName && (
          <div className="text-dorado-claro">
            <span className="font-semibold">Domiciliario:</span> {delivery.assignedName}
          </div>
        )}
        {delivery.notes && (
          <div className="text-yellow-400">
            <span className="font-semibold">Notas:</span> {delivery.notes}
          </div>
        )}
      </div>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
      <p className="text-dorado-oscuro text-center">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-negro flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏮</div>
          <p className="text-dorado">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-negro flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error al cargar las entregas</p>
          <p className="text-dorado-oscuro text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-negro">
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

      <nav className="bg-gray-800 border-b border-dorado-oscuro/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            {hasPermission('view_dashboard') && (
              <button
                onClick={() => navigate('/admin')}
                className="py-3 px-4 font-medium text-dorado-oscuro hover:text-dorado"
              >
                ← Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('available')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'available'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos Disponibles ({availableDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('my deliveries')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'my deliveries'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Mis Entregas ({myDeliveries.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'history'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Historial ({historyDeliveries.length})
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'available' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos Disponibles</h2>
            {availableDeliveries.length === 0 ? (
              <EmptyState message="No hay pedidos disponibles para recoger" />
            ) : (
              <div className="grid gap-4">
                {availableDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    action={
                      <button
                        onClick={() => handleTakeDelivery(delivery.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded"
                      >
                        Recoger Pedido
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my deliveries' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Mis Entregas Activas</h2>
            {myDeliveries.length === 0 ? (
              <EmptyState message="No tienes entregas activas en este momento" />
            ) : (
              <div className="grid gap-4">
                {myDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    action={
                      <button
                        onClick={() => handleMarkDelivered(delivery.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded"
                      >
                        Marcar como Entregado
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Historial de Entregas</h2>
            {historyDeliveries.length === 0 ? (
              <EmptyState message="Aún no hay entregas realizadas" />
            ) : (
              <div className="grid gap-4">
                {historyDeliveries.map((delivery) => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryDashboard;
