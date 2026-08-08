import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Datos de ejemplo
  const stats = {
    todaySales: 450000,
    todayOrders: 12,
    activeTables: 5,
    lowStockItems: 3,
  };

  return (
    <div className="min-h-screen bg-negro">
      {/* Header */}
      <header className="bg-gray-900 border-b border-dorado-oscuro/30 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="font-cormorant text-2xl font-bold text-dorado-claro">
              Panel de Administración
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
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Menú
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Inventario
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Empleados
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'text-dorado border-b-2 border-dorado'
                  : 'text-dorado-oscuro hover:text-dorado'
              }`}
            >
              Reportes
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Resumen del Día</h2>
            
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="text-dorado-oscuro text-sm">Ventas Hoy</div>
                <div className="text-2xl font-bold text-dorado">
                  ${stats.todaySales.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="text-dorado-oscuro text-sm">Pedidos Hoy</div>
                <div className="text-2xl font-bold text-dorado">
                  {stats.todayOrders}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="text-dorado-oscuro text-sm">Mesas Activas</div>
                <div className="text-2xl font-bold text-dorado">
                  {stats.activeTables}/8
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
                <div className="text-dorado-oscuro text-sm">Stock Bajo</div>
                <div className="text-2xl font-bold text-red-500">
                  {stats.lowStockItems}
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <h3 className="text-lg font-cormorant text-dorado mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('menu')}
                className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-4 px-6 rounded-lg"
              >
                Actualizar Menú
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-4 px-6 rounded-lg"
              >
                Ver Inventario
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-4 px-6 rounded-lg"
              >
                Generar Reporte
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-4 px-6 rounded-lg"
              >
                Gestionar Empleados
              </button>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-cormorant text-dorado">Gestión del Menú</h2>
              <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                + Agregar Plato
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                Lista de platos del menú con opciones de editar/eliminar
              </p>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-cormorant text-dorado">Control de Inventario</h2>
              <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                + Agregar Producto
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                Lista de productos con stock actual y alertas de stock bajo
              </p>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-cormorant text-dorado">Gestión de Empleados</h2>
              <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                + Agregar Empleado
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-dorado-oscuro/20">
              <p className="text-dorado-oscuro text-center">
                Lista de empleados con roles y permisos
              </p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div>
            <h2 className="text-xl font-cormorant text-dorado mb-6">Reportes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">
                  Reporte de Ventas
                </h3>
                <p className="text-dorado-oscuro mb-4">
                  Resumen de ventas por día, semana o mes
                </p>
                <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                  Generar Reporte
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">
                  Reporte de Inventario
                </h3>
                <p className="text-dorado-oscuro mb-4">
                  Productos más usados y rotación de stock
                </p>
                <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                  Generar Reporte
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">
                  Reporte de Empleados
                </h3>
                <p className="text-dorado-oscuro mb-4">
                  Horarios y desempeño del personal
                </p>
                <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                  Generar Reporte
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
                <h3 className="text-lg font-cormorant text-dorado mb-4">
                  Reporte de Platos
                </h3>
                <p className="text-dorado-oscuro mb-4">
                  Platos más vendidos y rentabilidad
                </p>
                <button className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded">
                  Generar Reporte
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