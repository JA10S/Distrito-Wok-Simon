import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChefAnimation from '../../components/common/ChefAnimation';
import ModeToggle from '../../components/common/ModeToggle';
import { FaEnvelope, FaLock, FaSignInAlt, FaSpinner } from 'react-icons/fa';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [chefImgOk, setChefImgOk] = useState(true);

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

  const BrandArt = () =>
    chefImgOk ? (
      <div className="login-chef absolute inset-0">
        <img
          src="/assets/images/login-chef.jpg"
          alt=""
          aria-hidden="true"
          className="login-chef-img block w-full h-full object-cover"
          style={{ objectPosition: '40% center' }}
          onError={() => setChefImgOk(false)}
        />
      </div>
    ) : (
      <ChefAnimation
        size={480}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glow text-dorado"
      />
    );

  return (
    <main className="relative min-h-screen bg-surface pattern-bg flex items-center justify-center px-4 py-10">
      <ModeToggle className="absolute top-4 right-4" />

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Lado izquierdo: marca sobre la ilustración de fondo (solo desktop) */}
        <section
          className="login-brand surface-dark relative hidden lg:block rounded-3xl overflow-hidden border border-dorado/15 h-[460px] bg-negro"
          aria-label="Distrito Wok Simón"
        >
          <BrandArt />
          {/* Velo oscuro para legibilidad del texto */}
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

          {/* Contenido de marca (aparece con fade-in de 0.8s) */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
            <h1>
              <img
                src="/assets/images/Logo_actualizado.png"
                alt="Distrito Wok Simón - Restaurante Chino"
                className="w-[320px] max-w-[85%] rounded-xl border border-dorado/20 shadow-[0_8px_32px_rgba(0,0,0,0.55)]"
              />
            </h1>
            <p className="login-brand-text font-cormorant italic text-dorado tracking-[0.3em] mt-6 text-lg">
              * SABOR QUE ENAMORA *
            </p>
          </div>
        </section>

        {/* Lado derecho: solo el formulario (entra con slide-up, delay 0.2s) */}
        <div className="login-form w-full max-w-md mx-auto lg:mx-0">
          {/* Marca compacta (móvil, apilado) */}
          <div className="lg:hidden text-center mb-6">
            <div
              className="login-chef surface-dark relative overflow-hidden rounded-2xl mx-auto bg-negro"
              style={{ width: 270, maxWidth: '100%' }}
            >
              <img
                src="/assets/images/login-chef.jpg"
                alt="Chef cocinando en un wok con llamas"
                className="login-chef-img block w-full"
                onError={() => setChefImgOk(false)}
              />
            </div>
            <h1 className="mt-4">
              <img
                src="/assets/images/Logo_actualizado.png"
                alt="Distrito Wok Simón - Restaurante Chino"
                className="w-[220px] max-w-full mx-auto rounded-lg border border-dorado/20 shadow-lg"
              />
            </h1>
            <p className="login-brand-text font-cormorant italic text-dorado tracking-[0.25em] text-sm mt-3">
              * SABOR QUE ENAMORA *
            </p>
          </div>

          <div className="bg-surface-2/85 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-dorado/25 hover-lift">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-8 bg-dorado-oscuro/50" />
              <h2 className="text-2xl font-cormorant text-dorado text-center">
                Iniciar Sesión
              </h2>
              <span className="h-px w-8 bg-dorado-oscuro/50" />
            </div>

            {error && (
              <div className="bg-rojo/10 border border-rojo/40 text-ink px-4 py-3 rounded mb-4 flex items-center gap-2" role="alert">
                <FaLock aria-hidden="true" className="text-rojo shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block font-cormorant text-lg font-medium tracking-wide text-dorado-claro mb-2" htmlFor="login-email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <FaEnvelope
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado/70"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input w-full bg-surface-3 border border-dorado-oscuro/50 rounded-lg pl-10 pr-4 py-3 text-ink placeholder:text-dorado-oscuro/60"
                    placeholder="usuario@restaurante.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-cormorant text-lg font-medium tracking-wide text-dorado-claro mb-2" htmlFor="login-password">
                  Contraseña
                </label>
                <div className="relative">
                  <FaLock
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-dorado/70"
                  />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input w-full bg-surface-3 border border-dorado-oscuro/50 rounded-lg pl-10 pr-4 py-3 text-ink placeholder:text-dorado-oscuro/60"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Hover: eleva + escala 1.02 · Active: escala 0.98 (ver .btn-gold en App.css) */}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full text-negro font-bold tracking-wide py-3 px-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
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
    </main>
  );
}

export default LoginPage;
