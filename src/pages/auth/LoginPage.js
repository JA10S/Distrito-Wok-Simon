import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, userRoles, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userRoles && userRoles.length > 0) {
      const targetRoute = getRouteForRoles(userRoles);
      navigate(targetRoute, { replace: true });
    }
  }, [userRoles, currentUser, navigate]);

  const getRouteForRoles = (roles) => {
    if (roles.includes('admin')) return '/admin';
    if (roles.includes('waiter')) return '/waiter';
    if (roles.includes('cashier')) return '/cashier';
    if (roles.includes('delivery')) return '/delivery';
    return '/menu';
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      console.error('Error:', error);
      setError('Credenciales incorrectas. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-negro flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-cormorant text-4xl font-bold text-dorado-claro">
            Distrito <span className="text-rojo italic">Wok</span> Simón
          </h1>
          <p className="text-dorado-oscuro mt-2">Sistema de Gestión</p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 shadow-xl border border-dorado-oscuro/30">
          <h2 className="text-2xl font-cormorant text-dorado text-center mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-dorado-claro text-sm mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-negro border border-dorado-oscuro rounded px-4 py-3 text-dorado-claro focus:outline-none focus:border-dorado"
                placeholder="usuario@restaurante.com"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-dorado-claro text-sm mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-negro border border-dorado-oscuro rounded px-4 py-3 text-dorado-claro focus:outline-none focus:border-dorado"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-dorado-oscuro hover:text-dorado text-sm">
              ← Volver al menú
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
