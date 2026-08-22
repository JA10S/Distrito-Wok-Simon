import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import { useTimer } from '../../hooks/useTimer';
import OrderCreator from '../../components/waiter/OrderCreator';
import OrderCard from '../../components/waiter/OrderCard';
import OrderEditor from '../../components/waiter/OrderEditor';

function TableCard({ table, onClick }) {
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
  const { orders, loading: ordersLoading, createOrder, updateOrderStatus, updateOrder, cancelOrder } = useOrders();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleCreateOrder = async (orderData) => {
    const result = await createOrder(orderData);
    
    if (result.success) {
      await updateTableStatus(orderData.tableId, 'occupied');
      alert('Pedido creado exitosamente');
      setSelectedTable(null);
      setActiveTab('orders');
    } else {
      alert('Error al crear pedido: ' + result.error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateOrderStatus(orderId, newStatus);
    
    if (result.success && newStatus === 'paid') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await updateTableStatus(order.tableId, 'available');
      }
    }
  };

  const handleEditOrder = async (orderId, updates) => {
    const result = await updateOrder(orderId, updates);
    
    if (result.success) {
      alert('Pedido actualizado exitosamente');
      setEditingOrder(null);
    } else {
      alert('Error al actualizar pedido: ' + result.error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const result = await cancelOrder(orderId);
    
    if (result.success) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await updateTableStatus(order.tableId, 'available');
      }
      alert('Pedido cancelado');
      setEditingOrder(null);
    } else {
      alert('Error al cancelar pedido: ' + result.error);
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
        {/* Vista de Mesas */}
        {activeTab === 'tables' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Estado de Mesas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => {
                    if (table.status === 'available') {
                      setSelectedTable(table);
                      setActiveTab('new-order');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pedidos Activos */}
        {activeTab === 'orders' && (
          <div>
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
            <OrderCreator
              tables={tables}
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
              onConfirmOrder={handleCreateOrder}
            />
          </div>
        )}
      </main>

      {/* Modal de edición de pedido */}
      {editingOrder && (
        <OrderEditor
          order={editingOrder}
          onUpdate={handleEditOrder}
          onCancel={handleCancelOrder}
          onClose={() => setEditingOrder(null)}
        />
      )}
    </div>
  );
}

export default WaiterDashboard;
