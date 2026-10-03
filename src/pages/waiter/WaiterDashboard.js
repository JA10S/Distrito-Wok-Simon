import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrders, ACTIVE_ORDER_STATUSES } from '../../hooks/useOrders';
import { useCalls } from '../../hooks/useCalls';
import { useShift } from '../../hooks/useShift';
import { useTimer } from '../../hooks/useTimer';
import OrderCreator from '../../components/waiter/OrderCreator';
import OrderCard from '../../components/waiter/OrderCard';
import OrderEditor from '../../components/waiter/OrderEditor';
import RecentCancelledOrders from '../../components/waiter/RecentCancelledOrders';
import DashboardHeader from '../../components/layout/DashboardHeader';
import SummaryStats from '../../components/common/SummaryStats';
import { FaChair, FaReceipt, FaPlusCircle, FaCheckCircle, FaInbox, FaHistory, FaBell, FaRegClock } from 'react-icons/fa';
import {
  findDuplicateOrder,
  getOrderLabel,
  getTopItems,
  isToday,
  minutesAgo,
  timestampMs,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS
} from '../../utils/orderUtils';

const formatClock = (value) => {
  const ms = timestampMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const TYPE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'table', label: 'Mesa' },
  { id: 'delivery', label: 'Domicilio' },
  { id: 'pickup', label: 'Recoger' }
];

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
      className={`rounded-lg p-4 border-2 cursor-pointer transition hover-lift ${
        table.status === 'available'
          ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20'
          : table.status === 'occupied'
          ? 'border-red-500 bg-red-500/10'
          : 'border-yellow-500 bg-yellow-500/10'
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [chargingOrder, setChargingOrder] = useState(null);
  const [transferringOrder, setTransferringOrder] = useState(null);

  const { tables, loading: tablesLoading, error: tablesError, updateTableStatus } = useTables();
  const { orders, loading: ordersLoading, error: ordersError, createOrder, updateOrderStatus, updateOrder, cancelOrder, reactivateOrder, processPayment, transferOrder } = useOrders(ACTIVE_ORDER_STATUSES);
  const { orders: cancelledOrders } = useOrders('cancelled');
  const { orders: paidOrders } = useOrders('paid');

  const topItems = useMemo(() => {
    const todayOrders = paidOrders.filter((order) =>
      isToday(timestampMs(order.paidAt) || timestampMs(order.createdAt))
    );
    return getTopItems(todayOrders, 5);
  }, [paidOrders]);

  const { pendingCalls, resolveCall } = useCalls();
  const { shift, closeShift } = useShift(currentUser?.uid);

  const myOrdersToday = useMemo(
    () =>
      paidOrders.filter(
        (order) =>
          order.waiterId === currentUser?.uid &&
          isToday(timestampMs(order.paidAt) || timestampMs(order.createdAt))
      ),
    [paidOrders, currentUser]
  );

  const shiftSummary = useMemo(() => {
    const byMethod = { cash: 0, nequi: 0, card: 0 };
    myOrdersToday.forEach((order) => {
      const method = order.paymentMethod;
      if (method && byMethod.hasOwnProperty(method)) {
        byMethod[method] += order.total || 0;
      }
    });

    const times = myOrdersToday
      .map((order) => timestampMs(order.paidAt) || timestampMs(order.createdAt))
      .filter((ms) => ms > 0)
      .sort((a, b) => a - b);

    return {
      orders: myOrdersToday.length,
      total: myOrdersToday.reduce((sum, order) => sum + (order.total || 0), 0),
      byMethod,
      firstOrderAt: times[0] || null,
      lastOrderAt: times[times.length - 1] || null
    };
  }, [myOrdersToday]);

  const handleCharge = (order) => {
    if (!hasPermission('charge_orders')) {
      alert('No tiene permiso para cobrar pedidos');
      return;
    }
    if (order.status !== 'ready') {
      alert('Solo se pueden cobrar pedidos listos');
      return;
    }
    setChargingOrder(order);
  };

  const handleProcessPayment = async (method) => {
    const order = chargingOrder;
    setChargingOrder(null);
    if (!order) return;

    const result = await processPayment(order.id, method, currentUser);
    if (result.success) {
      alert('Pago procesado exitosamente');
    } else {
      alert('Error al procesar pago: ' + result.error);
    }
  };

  const handleTransferRequest = (order) => {
    if (!hasPermission('transfer_order')) {
      alert('No tiene permiso para trasladar pedidos');
      return;
    }
    if (!order.tableId) {
      alert('Este pedido no está en una mesa');
      return;
    }
    setTransferringOrder(order);
  };

  const handleTransfer = async (targetTable) => {
    const order = transferringOrder;
    if (!order) return;

    if (!window.confirm(`¿Trasladar el pedido de ${getOrderLabel(order)} a la mesa ${targetTable.number}?`)) {
      return;
    }

    setTransferringOrder(null);

    const result = await transferOrder(order.id, targetTable);
    if (!result.success) {
      alert('Error al trasladar pedido: ' + result.error);
      return;
    }

    if (result.previousTableId && result.previousTableId !== targetTable.id) {
      const otherActive = orders.some(
        (o) => o.tableId === result.previousTableId && o.id !== order.id
      );
      if (!otherActive) {
        const freeResult = await updateTableStatus(result.previousTableId, 'available');
        if (!freeResult.success) {
          alert('Pedido trasladado, pero no se pudo liberar la mesa anterior: ' + freeResult.error);
        }
      }
    }

    const occupyResult = await updateTableStatus(targetTable.id, 'occupied', order.id);
    if (!occupyResult.success) {
      alert('Pedido trasladado, pero no se pudo ocupar la mesa destino: ' + occupyResult.error);
      return;
    }

    alert(`Pedido trasladado a la mesa ${targetTable.number}`);
  };

  const handleResolveCall = async (call) => {
    if (!hasPermission('attend_calls')) {
      alert('No tiene permiso para atender llamados');
      return;
    }
    const result = await resolveCall(call.id, currentUser);
    if (!result.success) {
      alert('Error al atender el llamado: ' + result.error);
    }
  };

  const handleCloseShift = async () => {
    if (!hasPermission('close_shift')) {
      alert('No tiene permiso para cerrar el turno');
      return;
    }
    if (shift) {
      alert('El turno de hoy ya fue cerrado');
      return;
    }
    if (!window.confirm('¿Cerrar el turno de hoy?')) return;

    const result = await closeShift(shiftSummary);
    if (!result.success) {
      alert('Error al cerrar el turno: ' + result.error);
      return;
    }
    alert('Turno cerrado exitosamente');
  };

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
      return { success: false };
    }

    const duplicate = findDuplicateOrder(orderData.items, cancelledOrders);
    if (duplicate) {
      const matchLabel = duplicate.matchType === 'equal' ? 'IGUAL' : 'SIMILAR';
      const kitchenLabel = duplicate.order.cancelledFromStatus
        ? ` y ya estaba en cocina (${ORDER_STATUS_LABELS[duplicate.order.cancelledFromStatus] || duplicate.order.cancelledFromStatus})`
        : '';
      const proceed = window.confirm(
        `⚠️ Posible pedido duplicado\n\n` +
        `${getOrderLabel(duplicate.order)} canceló hace ${duplicate.minutesAgo} min un pedido ${matchLabel}${kitchenLabel}.\n\n` +
        `¿Crear el pedido de todos modos?`
      );
      if (!proceed) return { success: false };
    }

    const result = await createOrder({
      ...orderData,
      waiterId: currentUser?.uid || null,
      waiterName: currentUser?.displayName || currentUser?.email || ''
    });
    
    if (result.success) {
      if (orderData.tableId) {
        const tableResult = await updateTableStatus(orderData.tableId, 'occupied', result.id);
        if (!tableResult.success) {
          alert('Pedido creado, pero no se pudo marcar la mesa como ocupada: ' + tableResult.error);
        }
      }
      alert('Pedido creado exitosamente');
      setSelectedTable(null);
      setActiveTab('orders');
    } else {
      alert('Error al crear pedido: ' + result.error);
    }
    return result;
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!hasPermission('update_order_status')) {
      alert('No tiene permiso para cambiar el estado de pedidos');
      return;
    }

    const result = await updateOrderStatus(orderId, newStatus);
    
    if (!result.success) {
      alert('Error al cambiar estado: ' + result.error);
    }
  };

  const handleEditOrder = async (orderId, updates) => {
    if (!hasPermission('create_order')) {
      alert('No tiene permiso para modificar pedidos');
      return;
    }

    const target = orders.find(o => o.id === orderId);
    if (target && target.status !== 'pending') {
      alert('Solo se pueden editar pedidos pendientes (aún no han entrado en cocina)');
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
      if (target.status === 'paid') {
        alert('No se puede cancelar un pedido ya pagado');
        return;
      }
      const inKitchen = target.status !== 'pending';
      if (inKitchen && !hasPermission('view_dashboard')) {
        alert('Solo un administrador puede cancelar pedidos que ya entraron en cocina o están listos');
        return;
      }
      if (inKitchen && !reason) {
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
        const tableResult = await updateTableStatus(target.tableId, 'available');
        if (!tableResult.success) {
          alert('Pedido cancelado, pero no se pudo liberar la mesa: ' + tableResult.error);
        }
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

    const inKitchen = order.status !== 'pending';

    if (inKitchen && !hasPermission('view_dashboard')) {
      alert('Solo un administrador puede cancelar pedidos que ya entraron en cocina o están listos');
      return;
    }

    const proceed = window.confirm(
      `¿Cancelar el pedido de ${getOrderLabel(order)}` +
      (order.status === 'ready'
        ? '? (ESTÁ LISTO — el plato ya está hecho)'
        : inKitchen
        ? '? (YA ESTÁ EN COCINA — el plato puede estar hecho)'
        : '?')
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

    if (!window.confirm(`¿Reactivar el pedido de ${getOrderLabel(order)}?`)) return;

    const result = await reactivateOrder(order.id);
    if (!result.success) {
      alert('Error al reactivar pedido: ' + result.error);
      return;
    }

    const table = tables.find(t => t.id === order.tableId);
    if (table && (table.status === 'available' || (table.status === 'occupied' && !table.currentOrderId))) {
      const tableResult = await updateTableStatus(order.tableId, 'occupied', order.id);
      if (!tableResult.success) {
        alert('Pedido reactivado, pero no se pudo ocupar la mesa: ' + tableResult.error);
      }
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
        if (order.status !== 'pending') {
          alert(`El pedido de la mesa ${table.number} ya está en cocina y no se puede modificar`);
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

  const filteredOrders = typeFilter === 'all'
    ? orders
    : orders.filter(o => (o.type || 'table') === typeFilter);

  if (tablesLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏮</div>
          <p className="text-dorado font-cormorant text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader
        title="Panel del Camarero"
        user={currentUser?.email}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={hasPermission('view_dashboard') ? () => navigate('/admin') : null}
        tabs={[
          { id: 'tables', label: 'Mesas', icon: <FaChair />, badge: tables.length },
          { id: 'orders', label: 'Pedidos', icon: <FaReceipt />, badge: orders.length },
          ...(hasPermission('attend_calls')
            ? [{ id: 'calls', label: 'Llamados', icon: <FaBell />, badge: pendingCalls.length }]
            : []),
          ...(hasPermission('close_shift')
            ? [{ id: 'shift', label: 'Mi turno', icon: <FaRegClock /> }]
            : []),
          ...(hasPermission('view_history')
            ? [{ id: 'history', label: 'Historial', icon: <FaHistory /> }]
            : []),
          ...(hasPermission('create_order')
            ? [{ id: 'new-order', label: 'Nuevo Pedido', icon: <FaPlusCircle /> }]
            : [])
        ]}
      />

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Errores de sincronización (Firestore/reglas) */}
        {(tablesError || ordersError) && (
          <div className="mb-6 bg-rojo/10 border border-rojo/40 text-ink px-4 py-3 rounded-lg text-sm" role="alert">
            ⚠️ Error al sincronizar datos: {tablesError || ordersError}
          </div>
        )}

        {/* Resúmenes (permiso view_summaries otorgado por el admin) */}
        {hasPermission('view_summaries') && (
          <SummaryStats
            stats={[
              { label: 'Mesas disponibles', value: tables.filter(t => t.status === 'available').length, icon: <FaChair />, iconColor: 'text-green-500', valueColor: 'text-green-500' },
              { label: 'Mesas ocupadas', value: tables.filter(t => t.status === 'occupied').length, icon: <FaChair />, iconColor: 'text-red-500', valueColor: 'text-red-500' },
              { label: 'Pedidos activos', value: orders.length, icon: <FaReceipt />, iconColor: 'text-yellow-500', valueColor: 'text-yellow-500' },
              { label: 'Pedidos listos', value: orders.filter(o => o.status === 'ready').length, icon: <FaCheckCircle />, iconColor: 'text-green-500', valueColor: 'text-green-500' }
            ]}
          />
        )}

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

            <h2 className="text-xl font-cormorant text-dorado mb-4">Pedidos Activos</h2>

            {/* Filtro por tipo de pedido */}
            <div className="flex flex-wrap gap-2 mb-4">
              {TYPE_FILTERS.map((filter) => {
                const count = filter.id === 'all'
                  ? orders.length
                  : orders.filter(o => (o.type || 'table') === filter.id).length;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setTypeFilter(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      typeFilter === filter.id
                        ? 'bg-dorado text-negro'
                        : 'bg-surface-3 text-dorado-oscuro hover:text-dorado-claro border border-dorado-oscuro/30'
                    }`}
                  >
                    {filter.label} ({count})
                  </button>
                );
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20 text-center">
                <FaInbox className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
                <p className="text-dorado-oscuro">
                  {orders.length === 0
                    ? 'No hay pedidos activos en este momento'
                    : 'No hay pedidos de este tipo'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onEdit={setEditingOrder}
                    onCancel={handleCancelOrderRequest}
                    onCharge={handleCharge}
                    onTransfer={handleTransferRequest}
                    canEdit={hasPermission('create_order')}
                    canUpdateStatus={hasPermission('update_order_status')}
                    canCancel={hasPermission('update_order_status')}
                    canCancelKitchen={hasPermission('view_dashboard')}
                    canCharge={hasPermission('charge_orders')}
                    canTransfer={hasPermission('transfer_order')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Historial de pedidos pagados */}
        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Historial de Pedidos</h2>
            {paidOrders.length === 0 ? (
              <div className="bg-surface-2 rounded-xl p-6 border border-dorado-oscuro/25 text-center">
                <FaHistory className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
                <p className="text-dorado-oscuro">No hay pedidos pagados todavía</p>
              </div>
            ) : (
              <div className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 overflow-hidden">
                <div className="divide-y divide-dorado-oscuro/20">
                  {paidOrders.slice(0, 50).map((order) => (
                    <div key={order.id} className="px-5 py-4 flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <span className="font-inter text-dorado-claro font-semibold tracking-tight">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-3 font-inter">
                          {getOrderLabel(order)}
                        </span>
                        {order.waiterName && (
                          <span className="text-dorado-oscuro/70 text-xs ml-3">👤 {order.waiterName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-dorado-oscuro text-sm font-inter">
                          {order.paymentMethod
                            ? PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod
                            : '—'}
                        </span>
                        <span className="font-inter text-dorado font-semibold">
                          ${(order.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Llamados de atención de los clientes */}
        {activeTab === 'calls' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Llamados de Atención</h2>
            {pendingCalls.length === 0 ? (
              <div className="bg-surface-2 rounded-xl p-6 border border-dorado-oscuro/25 text-center">
                <FaBell className="mx-auto text-dorado-oscuro text-3xl mb-2" aria-hidden="true" />
                <p className="text-dorado-oscuro">No hay llamados pendientes</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingCalls.map((call) => {
                  const mins = minutesAgo(call.createdAt);
                  return (
                    <div
                      key={call.id}
                      className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 flex justify-between items-center gap-3 hover-lift"
                    >
                      <div>
                        <div className="text-dorado-claro font-bold">Mesa {call.tableNumber}</div>
                        {call.message && (
                          <div className="text-dorado-oscuro text-sm">“{call.message}”</div>
                        )}
                        <div className="text-dorado-oscuro/70 text-xs mt-1">
                          {mins !== null ? `hace ${mins} min` : 'ahora'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveCall(call)}
                        className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded text-sm shrink-0"
                      >
                        ✅ Atendido
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mi turno del día */}
        {activeTab === 'shift' && (() => {
          const displayed = shift && shift.summary ? shift.summary : shiftSummary;
          return (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Mi Turno de Hoy</h2>
            <div className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 p-6 max-w-2xl">
              {shift && (
                <div
                  role="status"
                  className="mb-4 bg-green-500/10 border border-green-500/40 text-green-500 rounded-lg px-4 py-3 text-sm"
                >
                  ✅ Turno cerrado a las {formatClock(shift.closedAt)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-surface-3 rounded-lg p-4 text-center">
                  <div className="font-inter text-3xl font-semibold text-dorado-claro tabular-nums">
                    {displayed.orders || 0}
                  </div>
                  <div className="text-dorado-oscuro text-sm">Pedidos atendidos</div>
                </div>
                <div className="bg-surface-3 rounded-lg p-4 text-center">
                  <div className="font-inter text-3xl font-semibold text-dorado tabular-nums">
                    ${(displayed.total || 0).toLocaleString()}
                  </div>
                  <div className="text-dorado-oscuro text-sm">Total cobrado hoy</div>
                </div>
              </div>

              <div className="space-y-2 mb-5 text-sm">
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className="flex justify-between text-dorado-claro border-b border-dorado-oscuro/20 pb-2"
                  >
                    <span>{option.label}</span>
                    <span className="font-inter tabular-nums">
                      ${((displayed.byMethod && displayed.byMethod[option.id]) || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-dorado-oscuro pt-1">
                  <span>Primer pedido</span>
                  <span className="font-inter">{formatClock(displayed.firstOrderAt)}</span>
                </div>
                <div className="flex justify-between text-dorado-oscuro">
                  <span>Último pedido</span>
                  <span className="font-inter">{formatClock(displayed.lastOrderAt)}</span>
                </div>
              </div>

              <button
                onClick={handleCloseShift}
                disabled={!!shift}
                className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-6 rounded disabled:opacity-50"
              >
                {shift ? 'Turno cerrado' : '🕒 Cerrar turno'}
              </button>
            </div>
          </div>
          );
        })()}

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
                topItems={topItems}
              />
            ) : (
              <div className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20">
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

      {/* Modal de cobro (en mesa / recoger) */}
      {chargingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-xl border border-dorado/30 p-6 max-w-sm w-full">
            <h3 className="text-xl font-cormorant text-dorado-claro mb-1">Cobrar Pedido</h3>
            <p className="text-dorado-oscuro text-sm mb-4">
              Pedido #{chargingOrder.id.slice(-6).toUpperCase()} · {getOrderLabel(chargingOrder)}
            </p>

            <div className="text-center mb-5">
              <div className="font-inter text-3xl font-semibold text-dorado">
                ${(chargingOrder.total || 0).toLocaleString()}
              </div>
              <div className="text-xs text-dorado-oscuro">IVA 10% incluido</div>
            </div>

            <div className="space-y-2 mb-4">
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleProcessPayment(option.id)}
                  className="quick-card w-full rounded-lg py-3 font-semibold"
                  style={{ '--role': '212 168 67' }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setChargingOrder(null)}
              className="w-full text-dorado-oscuro hover:text-dorado py-2 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de traslado a otra mesa */}
      {transferringOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-xl border border-dorado/30 p-6 max-w-md w-full">
            <h3 className="text-xl font-cormorant text-dorado-claro mb-1">Trasladar Pedido</h3>
            <p className="text-dorado-oscuro text-sm mb-4">
              Pedido #{transferringOrder.id.slice(-6).toUpperCase()} · {getOrderLabel(transferringOrder)}
            </p>

            <p className="text-dorado-claro text-sm mb-3">Seleccione la mesa destino:</p>

            {tables.filter(t => t.status === 'available' && t.id !== transferringOrder.tableId).length === 0 ? (
              <p className="text-dorado-oscuro text-sm mb-4">No hay mesas disponibles para trasladar</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 mb-4 max-h-64 overflow-y-auto">
                {tables
                  .filter(t => t.status === 'available' && t.id !== transferringOrder.tableId)
                  .map(table => (
                    <button
                      key={table.id}
                      onClick={() => handleTransfer(table)}
                      className="p-3 rounded-lg border-2 border-dorado-oscuro/30 bg-surface-3 hover:border-dorado hover:bg-dorado/20 transition"
                      aria-label={`Mesa destino ${table.number}`}
                    >
                      <div className="text-dorado-claro font-bold">{table.number}</div>
                      <div className="text-dorado-oscuro text-xs">{table.capacity} pers.</div>
                    </button>
                  ))}
              </div>
            )}

            <button
              onClick={() => setTransferringOrder(null)}
              className="w-full text-dorado-oscuro hover:text-dorado py-2 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WaiterDashboard;
