import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import LoadingScreen from './components/common/LoadingScreen';
import OfflineBanner from './components/common/OfflineBanner';

// Páginas públicas
import MenuPage from './pages/client/MenuPage';

// Páginas privadas (carga diferida: cada panel baja su propio chunk)
import LoginPage from './pages/auth/LoginPage';

// Estilos
import './App.css';

const WaiterDashboard = lazy(() => import('./pages/waiter/WaiterDashboard'));
const CashierDashboard = lazy(() => import('./pages/cashier/CashierDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/DeliveryDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <OfflineBanner />
            <Suspense fallback={<LoadingScreen />}>
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
            </Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;