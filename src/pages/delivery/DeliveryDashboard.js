import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDeliveries } from '../../hooks/useDeliveries';
import DashboardHeader from '../../components/layout/DashboardHeader';
import SummaryStats from '../../components/common/SummaryStats';
import { FaBell, FaTruck, FaHistory, FaCheckCircle, FaBoxOpen } from 'react-icons/fa';

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
    <div className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 hover-lift">
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
          <div className="notes-box text-sm mt-1 p-2 rounded">
            <span className="notes-box-title font-semibold">🗒️ Notas:</span> {delivery.notes}
          </div>
        )}
      </div>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 text-center">
      <FaBoxOpen className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
      <p className="text-dorado-oscuro">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏮</div>
          <p className="text-dorado">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error al cargar las entregas</p>
          <p className="text-dorado-oscuro text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader
        title="Panel del Domiciliario"
        user={currentUser?.email}
        onLogout={logout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={hasPermission('view_dashboard') ? () => navigate('/admin') : null}
        tabs={[
          { id: 'available', label: 'Pedidos Disponibles', icon: <FaBell />, badge: availableDeliveries.length },
          { id: 'my deliveries', label: 'Mis Entregas', icon: <FaTruck />, badge: myDeliveries.length },
          { id: 'history', label: 'Historial', icon: <FaHistory />, badge: historyDeliveries.length }
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Resúmenes (permiso view_summaries otorgado por el admin) */}
        {hasPermission('view_summaries') && (
          <SummaryStats
            stats={[
              { label: 'Disponibles', value: availableDeliveries.length, icon: <FaBell />, iconColor: 'text-yellow-500', valueColor: 'text-yellow-500' },
              { label: 'Mis entregas activas', value: myDeliveries.length, icon: <FaTruck />, iconColor: 'text-blue-400', valueColor: 'text-blue-400' },
              { label: 'Entregadas', value: historyDeliveries.length, icon: <FaCheckCircle />, iconColor: 'text-green-500', valueColor: 'text-green-500' },
              { label: 'Total pedidos', value: deliveries.length, icon: <FaBoxOpen />, iconColor: 'text-dorado', valueColor: 'text-dorado' }
            ]}
          />
        )}

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
