import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Páginas públicas
import MenuPage from './pages/client/MenuPage';

// Páginas privadas
import LoginPage from './pages/auth/LoginPage';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

// Estilos
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas privadas - Camarero */}
            <Route path="/waiter/*" element={
              <PrivateRoute allowedRoles={['waiter', 'admin']}>
                <WaiterDashboard />
              </PrivateRoute>
            } />

            {/* Rutas privadas - Cajero */}
            <Route path="/cashier/*" element={
              <PrivateRoute allowedRoles={['cashier', 'admin']}>
                <CashierDashboard />
              </PrivateRoute>
            } />

            {/* Rutas privadas - Domiciliario */}
            <Route path="/delivery/*" element={
              <PrivateRoute allowedRoles={['delivery', 'admin']}>
                <DeliveryDashboard />
              </PrivateRoute>
            } />

            {/* Rutas privadas - Administrador */}
            <Route path="/admin/*" element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;