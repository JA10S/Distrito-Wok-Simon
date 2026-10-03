import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import { useDeliveries } from '../../hooks/useDeliveries';
import { useDriverLocations } from '../../hooks/useDriverLocations';
import MenuManager from '../../components/admin/MenuManager';
import RolesManager from '../../components/admin/RolesManager';
import UsersManager from '../../components/admin/UsersManager';
import ThemeManager from '../../components/admin/ThemeManager';
import DriversMap from '../../components/admin/DriversMap';
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
  FaReceipt,
  FaMapMarkedAlt
} from 'react-icons/fa';
import RecentCancelledOrders from '../../components/waiter/RecentCancelledOrders';

function AdminDashboard() {
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { tables, updateTableStatus } = useTables();
  const { orders } = useOrders();
  const { orders: cancelledOrders, reactivateOrder } = useOrders('cancelled');
  const { deliveries } = useDeliveries();
  const { drivers } = useDriverLocations();

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
    { name: 'Camarero', path: '/waiter', icon: <FaChair />, role: '34 197 94' },
    { name: 'Cajero', path: '/cashier', icon: <FaCashRegister />, role: '59 130 246' },
    { name: 'Domiciliario', path: '/delivery', icon: <FaMotorcycle />, role: '212 168 67' },
  ];

  const statusPill = {
    pending: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    preparing: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
    ready: 'bg-dorado/10 text-dorado-claro border border-dorado/40',
    cancelled: 'bg-red-500/10 text-red-300 border border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-surface">
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
          ...(hasPermission('track_drivers')
            ? [{ id: 'drivers', label: 'Repartidores', icon: <FaMapMarkedAlt /> }]
            : []),
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
                { label: 'Mesas Disponibles', value: availableTables, icon: <FaChair />, iconColor: 'text-emerald-400', valueColor: 'text-emerald-400' },
                { label: 'Mesas Ocupadas', value: occupiedTables, icon: <FaChair />, iconColor: 'text-rose-400', valueColor: 'text-rose-400' },
                { label: 'Pedidos Pendientes', value: pendingOrders, icon: <FaReceipt />, iconColor: 'text-amber-300', valueColor: 'text-amber-300' },
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
                  style={{ '--role': dash.role }}
                  className="quick-card rounded-xl py-6 px-6 flex items-center justify-center space-x-3 font-semibold text-lg"
                >
                  <span className="text-3xl" aria-hidden="true">{dash.icon}</span>
                  <span>{dash.name}</span>
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
            <div className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 overflow-hidden">
              {orders.length === 0 ? (
                <p className="text-dorado-oscuro text-center py-6 font-inter">
                  No hay pedidos registrados
                </p>
              ) : (
                <div className="divide-y divide-dorado-oscuro/20">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="px-5 py-4 flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <span className="font-inter text-dorado-claro font-semibold tracking-tight">
                          Pedido #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-dorado-oscuro text-sm ml-3 font-inter">
                          Mesa {order.tableNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {order.paymentStatus === 'paid' && (
                          <span className="font-inter rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 text-xs">
                            paid
                          </span>
                        )}
                        <span
                          className={`font-inter capitalize rounded-full px-3 py-1 text-xs border ${
                            statusPill[order.status] ||
                            'bg-surface-3 text-ink-muted border-line/60'
                          }`}
                        >
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
                <div key={dash.path} className="bg-surface-2 rounded-xl border border-dorado-oscuro/25 p-6 hover-lift">
                  <div className="text-center mb-4">
                    <span className="text-5xl inline-block" style={{ '--role': dash.role, color: 'rgb(var(--role))' }}>{dash.icon}</span>
                    <h3 className="text-xl font-cormorant text-dorado-claro mt-2">{dash.name}</h3>
                  </div>
                  <button
                    onClick={() => navigate(dash.path)}
                    style={{ '--role': dash.role }}
                    className="quick-card w-full rounded-lg py-3 px-4 font-semibold"
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

        {/* REPARTIDORES (ubicación en tiempo real) */}
        {activeTab === 'drivers' && (
          <DriversMap drivers={drivers} deliveries={deliveries} />
        )}

        {/* REPORTES */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Reportes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">Reporte de Menú</h3>
                <p className="text-dorado-oscuro mb-4">Generar PDF con precios actuales</p>
                <button
                  onClick={() => alert('Ejecuta: node scripts/generate-pdf-from-firestore.js')}
                  className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
                >
                  Generar PDF
                </button>
              </div>
              <div className="bg-surface-2 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">Reporte de Pedidos</h3>
                <p className="text-dorado-oscuro mb-4">Historial de pedidos del día</p>
                <button className="bg-surface-3 hover:bg-ink/10 text-dorado-claro font-bold py-2 px-4 rounded">
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
