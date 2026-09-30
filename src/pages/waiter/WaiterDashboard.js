import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrders, ACTIVE_ORDER_STATUSES } from '../../hooks/useOrders';
import { useTimer } from '../../hooks/useTimer';
import OrderCreator from '../../components/waiter/OrderCreator';
import OrderCard from '../../components/waiter/OrderCard';
import OrderEditor from '../../components/waiter/OrderEditor';
import RecentCancelledOrders from '../../components/waiter/RecentCancelledOrders';
import { findDuplicateOrder, ORDER_STATUS_LABELS } from '../../utils/orderUtils';

function TableCard({ table, onClick, onClose, canClose, hasActiveOrder }) {
  const timer = useTimer(table.occupiedAt);

  const getTimerColor = () => {
    if (!table.occupiedAt) return '';
    const level = timer.getWarningLevel();
    if (level === 'critical') return 'text-red-500';
    if (level === 'warning') return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 border-2 cursor-pointer transition ${
        table.status === 'available'
          ? 'border-green-500 bg-green-900/30 hover:bg-green-900/50'
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
        <div className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
          table.status === 'available' ? 'bg-green-600' :
          table.status === 'occupied' ? 'bg-red-600' :
          'bg-yellow-600'
        }`}>
          {table.status === 'available' ? 'Disponible' :
           table.status === 'occupied' ? 'Ocupada' :
           'Reservada'}
        </div>

        {/* Timer de ocupación */}
        {table.status === 'occupied' && table.occupiedAt && (
          <div className={`mt-2 text-sm font-mono ${getTimerColor()}`}>
            ⏱ {timer.format()}
          </div>
        )}

        {/* Acciones de la mesa */}
        {table.status === 'occupied' && hasActiveOrder && (
          <div className="mt-2 text-xs text-dorado-oscuro">
            Pedido activo — clic para ver
          </div>
        )}
        {table.status === 'occupied' && !hasActiveOrder && canClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(table);
            }}
            className="mt-2 w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-1 px-3 rounded text-sm"
          >
            Cerrar mesa
          </button>
        )}
      </div>
    </div>
  );
}

function WaiterDashboard() {
  const { currentUser, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tables');
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  
  const { tables, loading: tablesLoading, updateTableStatus } = useTables();
  const { orders, loading: ordersLoading, createOrder, updateOrderStatus, updateOrder, cancelOrder, reactivateOrder } = useOrders(ACTIVE_ORDER_STATUSES);
  const { orders: cancelledOrders } = useOrders('cancelled');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleCreateOrder = async (orderData) => {
    if (!hasPermission('create_order')) {
      alert('No tiene permiso para crear pedidos');
      return;
    }

    const duplicate = findDuplicateOrder(orderData.items, cancelledOrders);
    if (duplicate) {
      const matchLabel = duplicate.matchType === 'equal' ? 'IGUAL' : 'SIMILAR';
      const kitchenLabel = duplicate.order.cancelledFromStatus
        ? ` y ya estaba en cocina (${ORDER_STATUS_LABELS[duplicate.order.cancelledFromStatus] || duplicate.order.cancelledFromStatus})`
        : '';
      const proceed = window.confirm(
        `⚠️ Posible pedido duplicado\n\n` +
        `La mesa ${duplicate.order.tableNumber} canceló hace ${duplicate.minutesAgo} min un pedido ${matchLabel}${kitchenLabel}.\n\n` +
        `¿Crear el pedido de todos modos?`
      );
      if (!proceed) return;
    }

    const result = await createOrder({
      ...orderData,
      waiterId: currentUser?.uid || null,
      waiterName: currentUser?.displayName || currentUser?.email || ''
    });
    
    if (result.success) {
      await updateTableStatus(orderData.tableId, 'occupied', result.id);
      alert('Pedido creado exitosamente');
      setSelectedTable(null);
      setActiveTab('orders');
    } else {
      alert('Error al crear pedido: ' + result.error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!hasPermission('update_order_status')) {
      alert('No tiene permiso para cambiar el estado de pedidos');
      return;
    }

    const result = await updateOrderStatus(orderId, newStatus);
    
    if (!result.success) {
      alert('Error al cambiar estado: ' + result.error);
      return;
    }

    if (newStatus === 'paid') {
      const order = orders.find(o => o.id === orderId);
      const otherActive = orders.some(o => o.tableId === order?.tableId && o.id !== orderId);
      if (order?.tableId && !otherActive) {
        await updateTableStatus(order.tableId, 'available');
      }
    }
  };

  const handleEditOrder = async (orderId, updates) => {
    if (!hasPermission('create_order')) {
      alert('No tiene permiso para modificar pedidos');
      return;
    }

    const result = await updateOrder(orderId, updates);
    
    if (result.success) {
      alert('Pedido actualizado exitosamente');
      setEditingOrder(null);
    } else {
      alert('Error al actualizar pedido: ' + result.error);
    }
  };

  const handleCancelOrder = async (orderId, reason = null) => {
    if (!hasPermission('update_order_status')) {
      alert('No tiene permiso para cancelar pedidos');
      return;
    }

    const target = orders.find(o => o.id === orderId);

    if (target) {
      if (target.status === 'ready') {
        alert('No se puede cancelar un pedido listo para cobrar');
        return;
      }
      if (target.status === 'paid') {
        alert('No se puede cancelar un pedido ya pagado');
        return;
      }
      if (target.status !== 'pending' && !hasPermission('view_dashboard')) {
        alert('Solo un administrador puede cancelar pedidos que ya entraron en cocina');
        return;
      }
      if (target.status !== 'pending' && !reason) {
        alert('Debe indicar el motivo de la cancelación');
        return;
      }
    }

    const result = await cancelOrder(orderId, {
      userId: currentUser?.uid || null,
      name: currentUser?.displayName || currentUser?.email || '',
      reason
    });
    
    if (result.success) {
      const otherActive = orders.some(o => o.tableId === target?.tableId && o.id !== orderId);
      if (target?.tableId && !otherActive) {
        await updateTableStatus(target.tableId, 'available');
      }
      alert('Pedido cancelado');
      setEditingOrder(null);
    } else {
      alert('Error al cancelar pedido: ' + result.error);
    }
  };

  const handleCancelOrderRequest = (order) => {
    if (!hasPermission('update_order_status')) {
      alert('No tiene permiso para cancelar pedidos');
      return;
    }

    if (order.status === 'ready') {
      alert('No se puede cancelar un pedido listo para cobrar');
      return;
    }

    const inKitchen = order.status !== 'pending';

    if (inKitchen && !hasPermission('view_dashboard')) {
      alert('Solo un administrador puede cancelar pedidos que ya entraron en cocina');
      return;
    }

    const proceed = window.confirm(
      `¿Cancelar el pedido de la mesa ${order.tableNumber}` +
      (inKitchen ? '? (YA ESTÁ EN COCINA — el plato puede estar hecho)' : '?')
    );
    if (!proceed) return;

    let reason = null;
    if (inKitchen) {
      const input = window.prompt('Motivo de la cancelación (obligatorio):');
      if (input === null) return;
      reason = input.trim();
      if (!reason) {
        alert('Debe indicar el motivo de la cancelación');
        return;
      }
    } else {
      const input = window.prompt('Motivo de la cancelación (opcional, Enter para omitir):');
      if (input !== null && input.trim()) reason = input.trim();
    }

    handleCancelOrder(order.id, reason);
  };

  const handleReactivate = async (order) => {
    if (!hasPermission('update_order_status')) {
      alert('No tiene permiso para reactivar pedidos');
      return;
    }

    if (!window.confirm(`¿Reactivar el pedido de la mesa ${order.tableNumber}?`)) return;

    const result = await reactivateOrder(order.id);
    if (!result.success) {
      alert('Error al reactivar pedido: ' + result.error);
      return;
    }

    const table = tables.find(t => t.id === order.tableId);
    if (table && (table.status === 'available' || (table.status === 'occupied' && !table.currentOrderId))) {
      await updateTableStatus(order.tableId, 'occupied', order.id);
    }

    alert('Pedido reactivado');
    setActiveTab('orders');
  };

  const handleCloseTable = async (table) => {
    if (!hasPermission('close_table')) {
      alert('No tiene permiso para cerrar mesas');
      return;
    }

    if (orders.some(o => o.tableId === table.id)) {
      alert('La mesa tiene un pedido activo');
      return;
    }

    if (!window.confirm(`¿Cerrar la mesa ${table.number}?`)) return;

    const result = await updateTableStatus(table.id, 'available');
    if (!result.success) {
      alert('Error al cerrar mesa: ' + result.error);
    }
  };

  const handleTableClick = (table) => {
    if (table.status === 'available') {
      if (!hasPermission('create_order')) {
        alert('No tiene permiso para crear pedidos');
        return;
      }
      setSelectedTable(table);
      setActiveTab('new-order');
      return;
    }

    if (table.status === 'occupied') {
      const order = orders.find(o => o.tableId === table.id);

      if (order) {
        if (order.status === 'ready') {
          alert(`El pedido de la mesa ${table.number} está listo para cobrar`);
          return;
        }
        if (!hasPermission('create_order')) {
          alert('No tiene permiso para modificar pedidos');
          return;
        }
        setEditingOrder(order);
        return;
      }

      handleCloseTable(table);
    }
  };

  if (tablesLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-negro flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏮</div>
          <p className="text-dorado font-cormorant text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

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
            onClick={handleLogout}
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
            {hasPermission('view_dashboard') && (
              <button
                onClick={() => navigate('/admin')}
                className="py-3 px-4 font-medium text-dorado-oscuro hover:text-dorado"
              >
                ← Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab('tables')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'tables'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Mesas ({tables.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 font-medium ${
                activeTab === 'orders'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Pedidos ({orders.length})
            </button>
            {hasPermission('create_order') && (
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
            )}
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Vista de Mesas */}
        {activeTab === 'tables' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Estado de Mesas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => handleTableClick(table)}
                  onClose={handleCloseTable}
                  canClose={hasPermission('close_table')}
                  hasActiveOrder={orders.some((o) => o.tableId === table.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Activos */}
        {activeTab === 'orders' && (
          <div>
            <RecentCancelledOrders
              orders={cancelledOrders}
              onReactivate={handleReactivate}
              canReactivate={hasPermission('update_order_status')}
            />

            <h2 className="text-xl font-cormorant text-dorado mb-6">Pedidos Activos</h2>
            {orders.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No hay pedidos activos en este momento
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingOrder}
                    onCancel={handleCancelOrderRequest}
                    canEdit={hasPermission('create_order')}
                    canUpdateStatus={hasPermission('update_order_status')}
                    canCancel={hasPermission('update_order_status')}
                    canCancelKitchen={hasPermission('view_dashboard')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nuevo Pedido */}
        {activeTab === 'new-order' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Nuevo Pedido</h2>
            {hasPermission('create_order') ? (
              <OrderCreator
                tables={tables}
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
                onConfirmOrder={handleCreateOrder}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <p className="text-dorado-oscuro text-center">
                  No tiene permiso para crear pedidos
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de edición de pedido */}
      {editingOrder && (
        <OrderEditor
          order={editingOrder}
          onUpdate={handleEditOrder}
          onCancel={handleCancelOrderRequest}
          onClose={() => setEditingOrder(null)}
          canCancel={
            hasPermission('update_order_status') &&
            (editingOrder.status === 'pending' || hasPermission('view_dashboard'))
          }
        />
      )}
    </div>
  );
}

export default WaiterDashboard;
