import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import MenuManager from '../../components/admin/MenuManager';
import RolesManager from '../../components/admin/RolesManager';
import UsersManager from '../../components/admin/UsersManager';
import ThemeManager from '../../components/admin/ThemeManager';
import DashboardHeader from '../../components/layout/DashboardHeader';
import SummaryStats from '../../components/common/SummaryStats';
import {
  FaThLarge,
  FaTachometerAlt,
  FaUtensils,
  FaUserShield,
  FaUsers,
  FaPalette,
  FaChartBar,
  FaChair,
  FaCashRegister,
  FaMotorcycle,
  FaReceipt
} from 'react-icons/fa';
import RecentCancelledOrders from '../../components/waiter/RecentCancelledOrders';

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { tables, updateTableStatus } = useTables();
  const { orders } = useOrders();
  const { orders: cancelledOrders, reactivateOrder } = useOrders('cancelled');

  const handleReactivate = async (order) => {
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
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const dashboards = [
    { name: 'Camarero', path: '/waiter', icon: <FaChair />, emoji: '🍽️', color: 'bg-green-600' },
    { name: 'Cajero', path: '/cashier', icon: <FaCashRegister />, emoji: '💰', color: 'bg-blue-600' },
    { name: 'Domiciliario', path: '/delivery', icon: <FaMotorcycle />, emoji: '🛵', color: 'bg-yellow-600' },
  ];

  return (
    <div className="min-h-screen bg-negro">
      <DashboardHeader
        title="Panel de Administración"
        user={currentUser?.email}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: 'overview', label: 'Resumen', icon: <FaThLarge /> },
          { id: 'dashboards', label: 'Dashboards', icon: <FaTachometerAlt /> },
          { id: 'menu', label: 'Menú', icon: <FaUtensils /> },
          { id: 'roles', label: 'Roles', icon: <FaUserShield /> },
          { id: 'users', label: 'Usuarios', icon: <FaUsers /> },
          { id: 'theme', label: 'Apariencia', icon: <FaPalette /> },
          { id: 'reports', label: 'Reportes', icon: <FaChartBar /> }
        ]}
      />

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        
        {/* RESUMEN */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Resumen del Sistema</h2>
            
            {/* Estadísticas */}
            <SummaryStats
              stats={[
                { label: 'Mesas Disponibles', value: availableTables, icon: <FaChair />, iconColor: 'text-green-500', valueColor: 'text-green-500' },
                { label: 'Mesas Ocupadas', value: occupiedTables, icon: <FaChair />, iconColor: 'text-red-500', valueColor: 'text-red-500' },
                { label: 'Pedidos Pendientes', value: pendingOrders, icon: <FaReceipt />, iconColor: 'text-yellow-500', valueColor: 'text-yellow-500' },
                { label: 'Total Mesas', value: tables.length, icon: <FaThLarge />, iconColor: 'text-dorado', valueColor: 'text-dorado' }
              ]}
            />

            {/* Acceso rápido a dashboards */}
            <h3 className="text-lg font-cormorant text-dorado mb-4">Acceso Rápido</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {dashboards.map((dash) => (
                <button
                  key={dash.path}
                  onClick={() => navigate(dash.path)}
                  className={`${dash.color} hover:opacity-90 text-white font-bold py-6 px-6 rounded-lg flex items-center justify-center space-x-3 hover-lift`}
                >
                  <span className="text-3xl">{dash.icon}</span>
                  <span className="text-xl">{dash.name}</span>
                </button>
              ))}
            </div>

            {/* Cancelados recientes (cocina) */}
            <RecentCancelledOrders
              orders={cancelledOrders}
              onReactivate={handleReactivate}
              title="Cancelados recientes — avisar a cocina"
            />

            {/* Últimos pedidos */}
            <h3 className="text-lg font-cormorant text-dorado mb-4">Últimos Pedidos</h3>
            <div className="bg-gray-900 rounded-lg border border-dorado-oscuro/20">
              {orders.length === 0 ? (
                <p className="text-dorado-oscuro text-center py-4">No hay pedidos registrados</p>
              ) : (
                <div className="divide-y divide-dorado-oscuro/20">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-dorado-claro font-bold">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-2">
                          Mesa {order.tableNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'pending' ? 'bg-yellow-600' :
                          order.status === 'preparing' ? 'bg-blue-600' :
                          'bg-green-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DASHBOARDS */}
        {activeTab === 'dashboards' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Dashboards por Rol</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboards.map((dash) => (
                <div key={dash.path} className="bg-gray-900 rounded-lg border border-dorado-oscuro/20 p-6 hover-lift">
                  <div className="text-center mb-4">
                    <span className="text-5xl text-dorado inline-block">{dash.icon}</span>
                    <h3 className="text-xl font-cormorant text-dorado-claro mt-2">{dash.name}</h3>
                  </div>
                  <button
                    onClick={() => navigate(dash.path)}
                    className={`w-full ${dash.color} hover:opacity-90 text-white font-bold py-3 px-4 rounded`}
                  >
                    Abrir Panel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENÚ */}
        {activeTab === 'menu' && <MenuManager />}

        {/* ROLES */}
        {activeTab === 'roles' && <RolesManager />}

        {/* USUARIOS */}
        {activeTab === 'users' && <UsersManager />}

        {/* APARIENCIA */}
        {activeTab === 'theme' && <ThemeManager />}

        {/* REPORTES */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Reportes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">Reporte de Menú</h3>
                <p className="text-dorado-oscuro mb-4">Generar PDF con precios actuales</p>
                <button
                  onClick={() => alert('Ejecuta: node scripts/generate-pdf-from-firestore.js')}
                  className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
                >
                  Generar PDF
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">Reporte de Pedidos</h3>
                <p className="text-dorado-oscuro mb-4">Historial de pedidos del día</p>
                <button className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-2 px-4 rounded">
                  Ver Pedidos
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
