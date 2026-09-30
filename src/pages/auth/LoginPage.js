import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/common/Logo';
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaSpinner,
  FaUtensils,
  FaTruck,
  FaChartLine,
  FaShieldAlt
} from 'react-icons/fa';

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

  const features = [
    { icon: <FaUtensils />, text: 'Gestión de menú en tiempo real' },
    { icon: <FaTruck />, text: 'Pedidos en mesa, domicilio y recoger' },
    { icon: <FaChartLine />, text: 'Reportes y cuadre de caja' },
    { icon: <FaShieldAlt />, text: 'Roles y permisos por usuario' }
  ];

  return (
    <div className="min-h-screen bg-negro pattern-bg flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-10 items-center">
        {/* Panel de marca (solo desktop) */}
        <div className="hidden lg:flex flex-col items-center text-center animate-fade-in-up">
          <Logo size={130} className="glow text-dorado" />
          <h1 className="font-cormorant text-5xl font-bold mt-6">
            <span className="text-white">Distrito </span>
            <span className="text-gold-gradient">Wok Simón</span>
          </h1>
          <p className="text-dorado-oscuro tracking-[0.3em] text-sm uppercase mt-2">
            ★ Sabor que enamora ★
          </p>

          <ul className="mt-8 space-y-3 text-left">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-dorado-claro">
                <span className="w-9 h-9 rounded-full bg-dorado/10 border border-dorado/30 flex items-center justify-center text-dorado shrink-0">
                  {feature.icon}
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="lg:hidden text-center mb-6">
            <Logo size={80} className="mx-auto glow" />
            <h1 className="font-cormorant text-3xl font-bold text-dorado-claro mt-3">
              Distrito Wok Simón
            </h1>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 sm:p-8 shadow-2xl border border-dorado-oscuro/30 hover-lift">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-8 bg-dorado-oscuro/50" />
              <h2 className="text-2xl font-cormorant text-dorado text-center">
                Iniciar Sesión
              </h2>
              <span className="h-px w-8 bg-dorado-oscuro/50" />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 flex items-center gap-2" role="alert">
                <FaLock aria-hidden="true" className="text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-dorado-claro text-sm mb-2" htmlFor="login-email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FaEnvelope
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado-oscuro"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-negro border border-dorado-oscuro rounded pl-10 pr-4 py-3 text-dorado-claro focus:outline-none focus:border-dorado focus:ring-1 focus:ring-dorado/50 transition"
                    placeholder="usuario@restaurante.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-dorado-claro text-sm mb-2" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="relative">
                  <FaLock
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado-oscuro"
                  />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-negro border border-dorado-oscuro rounded pl-10 pr-4 py-3 text-dorado-claro focus:outline-none focus:border-dorado focus:ring-1 focus:ring-dorado/50 transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover-lift"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" aria-hidden="true" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <FaSignInAlt aria-hidden="true" />
                    Ingresar
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-dorado-oscuro hover:text-dorado text-sm transition-colors">
                ← Volver al menú
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
