import React, { useState, useEffect } from 'react';
import { useMenu } from '../../hooks/useMenu';
import { createTakeawayOrder, watchOrder } from '../../services/orderService';
import { createCall } from '../../services/callService';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../components/common/Logo';
import ModeToggle from '../../components/common/ModeToggle';
import SiteHeader from '../../components/client/SiteHeader';
import MenuDrawer from '../../components/client/MenuDrawer';
import CallWaiterButton from '../../components/client/CallWaiterButton';
import { GiRiceCooker, GiFrenchFries } from 'react-icons/gi';
import { TbMeat, TbGlass } from 'react-icons/tb';
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaClock,
  FaHeart
} from 'react-icons/fa';
import {
  parsePrice,
  calculateTotals,
  validateCustomerInfo,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS
} from '../../utils/orderUtils';

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', reference: '', notes: '' };

const SECTIONS = [
  { id: 'arroces', key: 'arroces', emoji: '🍚', label: 'Arroces', icon: <GiRiceCooker />, title: '🍚 Nuestros Arroces', subtitle: 'precio · medio / entero' },
  { id: 'corrientes', key: 'corrientes', emoji: '🍖', label: 'Corrientes', icon: <TbMeat />, title: '🍖 Corrientes', subtitle: 'platos principales' },
  { id: 'porciones', key: 'porciones', emoji: '🍽️', label: 'Porciones', icon: <GiFrenchFries />, title: '🍽️ Porciones', subtitle: 'acompañamientos' },
  { id: 'bebidas', key: 'bebidas', emoji: '🥤', label: 'Bebidas', icon: <TbGlass />, title: '🥤 Bebidas', subtitle: null }
];

function MenuPage() {
  const { menu, loading, error } = useMenu();
  const { theme } = useTheme();
  const layout = (theme && theme.layout) || 'clasic';

  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState('delivery');
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [preferredPayment, setPreferredPayment] = useState('cash');
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [liveOrder, setLiveOrder] = useState(null);

  useEffect(() => {
    if (!createdOrder || !createdOrder.id) return undefined;
    const unsubscribe = watchOrder(createdOrder.id, setLiveOrder, () => {});
    return () => unsubscribe();
  }, [createdOrder]);

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((i) => i.id === item.id);
      if (existing) {
        return current.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...current,
        { id: item.id, name: item.name, price: parsePrice(item.price), quantity: 1 }
      ];
    });
  };

  const removeFromCart = (itemId) => {
    setCart((current) =>
      current
        .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const updateCustomer = (field, value) => {
    setCustomer((current) => ({ ...current, [field]: value }));
  };

  const totals = calculateTotals(cart);

  const handleSubmitOrder = async () => {
    setFormError('');

    if (cart.length === 0) {
      setFormError('Agrega al menos un plato a tu pedido');
      return;
    }

    const validationError = validateCustomerInfo(orderType, customer);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    const result = await createTakeawayOrder({
      type: orderType,
      customer,
      preferredPayment,
      items: cart,
      notes: kitchenNotes,
      source: 'client'
    });
    setSubmitting(false);

    if (!result.success) {
      setFormError('No se pudo crear el pedido: ' + result.error);
      return;
    }

    setCreatedOrder({ id: result.id, orderNumber: result.orderNumber });
    setCart([]);
    setCustomer(EMPTY_CUSTOMER);
    setKitchenNotes('');
    setPreferredPayment('cash');
    setShowCart(false);
  };

  const closeConfirmation = () => {
    setCreatedOrder(null);
    setLiveOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Logo size={80} className="mx-auto glow animate-float" />
          <p className="text-dorado font-cormorant text-xl mt-4">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error al cargar el menú</p>
          <p className="text-dorado-oscuro text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className={layout === 'side' ? 'lg:flex' : ''}>
        {/* Barra lateral vertical (solo disposición lateral, escritorio) */}
        {layout === 'side' && (
          <aside
            aria-label="Navegación lateral"
            className="hidden lg:flex flex-col w-60 shrink-0 bg-surface-2 border-r border-dorado-oscuro/30 p-5 gap-4 sticky top-0 h-screen"
          >
            <Logo size={56} />
            <p className="font-cormorant text-xl font-bold text-gold-gradient">
              Distrito Wok Simón
            </p>
            <nav className="flex flex-col gap-2">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dorado-oscuro/30 bg-surface-3 text-dorado-claro text-sm hover:border-dorado/50 hover:bg-dorado/10 transition-colors"
                >
                  <span className="text-dorado text-xl" aria-hidden="true">{section.icon}</span>
                  <span>{section.label}</span>
                </a>
              ))}
            </nav>
            <ModeToggle className="mt-auto" />
          </aside>
        )}

        <div className={layout === 'side' ? 'flex-1 min-w-0' : ''}>
          <SiteHeader
            layout={layout}
            sections={SECTIONS}
            onOpenMenu={() => setMenuOpen(true)}
          />

          {layout !== 'clasic' && (
            <MenuDrawer
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              sections={SECTIONS}
              hideOnDesktop={layout === 'side'}
            />
          )}

          {/* Menú */}
          <main className="container mx-auto px-4 py-8">
            {SECTIONS.map((section) => {
              const items = (menu[section.key] || []).filter(
                (item) => item.available !== false
              );

              return (
                <section key={section.id} id={section.id} className="mb-12">
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-dorado/10 border border-dorado/30 text-dorado text-2xl mb-3 glow" aria-hidden="true">
                      {section.icon}
                    </span>
                    <h2 className="font-cormorant text-3xl font-semibold text-dorado">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="text-dorado-oscuro italic text-sm mt-1">
                        {section.subtitle}
                      </p>
                    )}
                    <div className="flex justify-center mt-2 space-x-2" aria-hidden="true">
                      <span className="text-dorado/30">—</span>
                      <span className="text-rojo/50">◆</span>
                      <span className="text-dorado/30">—</span>
                    </div>
                  </div>

                  <div className={`grid gap-3 ${layout === 'clasic' ? '' : 'sm:grid-cols-2'}`}>
                    {items.map((item) => (
                      <div key={item.id} className="bg-surface-2 rounded-lg p-4 border border-dorado-oscuro/20 hover:border-dorado/40 transition hover-lift animate-fade-in-up">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-cormorant text-lg font-bold text-dorado-claro">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-ink text-xs italic mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-dorado font-semibold text-sm">
                              {item.price}
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              className="mt-2 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-1 px-3 rounded text-xs"
                            >
                              ＋ Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>


      {/* Botón flotante del carrito */}
      {cart.length > 0 && !createdOrder && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-40 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-5 rounded-full shadow-[0_8px_24px_-6px_rgb(var(--color-dorado)/0.6)] flex items-center space-x-2 hover-lift animate-fade-in-up"
        >
          <span>🛒</span>
          <span className="bg-negro text-dorado rounded-full text-xs font-bold px-2 py-0.5">
            {cart.reduce((sum, i) => sum + i.quantity, 0)}
          </span>
          <span>${totals.total.toLocaleString('es-CO')}</span>
        </button>
      )}

      {/* Llamado de atención al camarero */}
      <CallWaiterButton onSubmit={createCall} />

      {/* Modal: carrito y datos de entrega */}
      {showCart && !createdOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-dorado-oscuro/40 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-cormorant text-2xl font-bold text-dorado">Tu pedido</h2>
              <button
                onClick={() => { setShowCart(false); setFormError(''); }}
                className="text-dorado-oscuro hover:text-dorado text-xl"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-surface-3 rounded p-2">
                  <span className="text-dorado-claro text-sm">
                    {item.name} <span className="text-dorado-oscuro">× {item.quantity}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-dorado text-sm">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-rojo hover:text-rojo-oscuro text-sm font-bold px-2"
                    >
                      −
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-dorado-oscuro/30 pt-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between text-dorado-oscuro">
                <span>Subtotal</span>
                <span>${totals.subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-dorado-oscuro">
                <span>IVA (10%)</span>
                <span>${totals.tax.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-dorado font-bold text-base">
                <span>Total</span>
                <span>${totals.total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Tipo de pedido */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setOrderType('delivery')}
                className={`p-3 rounded-lg border-2 transition text-sm ${
                  orderType === 'delivery'
                    ? 'border-dorado bg-dorado/20 text-dorado-claro'
                    : 'border-dorado-oscuro/30 bg-surface-3 text-dorado-oscuro'
                }`}
              >
                🛵 Domicilio
              </button>
              <button
                onClick={() => setOrderType('pickup')}
                className={`p-3 rounded-lg border-2 transition text-sm ${
                  orderType === 'pickup'
                    ? 'border-dorado bg-dorado/20 text-dorado-claro'
                    : 'border-dorado-oscuro/30 bg-surface-3 text-dorado-oscuro'
                }`}
              >
                🥡 Recoger en local
              </button>
            </div>

            {/* Datos del cliente */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dorado-oscuro text-xs mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => updateCustomer('name', e.target.value)}
                    className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-dorado-oscuro text-xs mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => updateCustomer('phone', e.target.value)}
                    className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                    placeholder="300 123 4567"
                  />
                </div>
              </div>

              {orderType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-dorado-oscuro text-xs mb-1">Dirección de entrega *</label>
                    <input
                      type="text"
                      value={customer.address}
                      onChange={(e) => updateCustomer('address', e.target.value)}
                      className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                      placeholder="Calle, número, barrio"
                    />
                  </div>
                  <div>
                    <label className="block text-dorado-oscuro text-xs mb-1">Referencia para el domiciliario</label>
                    <input
                      type="text"
                      value={customer.reference}
                      onChange={(e) => updateCustomer('reference', e.target.value)}
                      className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                      placeholder="Ej: portón negro al lado de la farmacia"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-dorado-oscuro text-xs mb-1">Método de pago preferido</label>
                <select
                  value={preferredPayment}
                  onChange={(e) => setPreferredPayment(e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-dorado-oscuro text-xs mb-1">Notas para el domiciliario</label>
                <input
                  type="text"
                  value={customer.notes}
                  onChange={(e) => updateCustomer('notes', e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                  placeholder="Ej: llamar al llegar"
                />
              </div>

              <div>
                <label className="block text-dorado-oscuro text-xs mb-1">Instrucciones para la cocina</label>
                <input
                  type="text"
                  value={kitchenNotes}
                  onChange={(e) => setKitchenNotes(e.target.value)}
                  className="w-full bg-surface-3 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro text-sm focus:border-dorado focus:outline-none"
                  placeholder="Ej: sin cebolla"
                />
              </div>
            </div>

            <p className="text-dorado-oscuro text-xs mt-3">
              Pagas al recibir: {orderType === 'delivery' ? 'en la puerta' : 'en el local'}. Pago preferido: {PAYMENT_METHOD_LABELS[preferredPayment]}.
            </p>

            {formError && (
              <p className="text-rojo text-sm mt-3">{formError}</p>
            )}

            <button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full mt-4 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : `Confirmar pedido · $${totals.total.toLocaleString('es-CO')}`}
            </button>
          </div>
        </div>
      )}

      {/* Modal: pedido creado + estado en vivo */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-2 border border-dorado rounded-lg w-full max-w-md p-6 text-center">
            <span className="text-4xl">✅</span>
            <h2 className="font-cormorant text-2xl font-bold text-dorado mt-2">
              ¡Pedido confirmado!
            </h2>
            <p className="text-dorado-claro text-sm mt-1">
              Pedido #{createdOrder.orderNumber} · {ORDER_TYPE_LABELS[liveOrder?.type] || 'Para llevar'}
            </p>

            <div className="bg-surface-3 rounded-lg p-4 mt-4">
              <p className="text-dorado-oscuro text-xs uppercase tracking-wider mb-1">Estado en vivo</p>
              <p className="text-dorado-claro font-bold text-lg">
                {liveOrder ? (ORDER_STATUS_LABELS[liveOrder.status] || liveOrder.status) : 'Cargando...'}
              </p>
              {liveOrder?.type === 'delivery' && liveOrder?.status === 'ready' && (
                <p className="text-dorado text-sm mt-1">🛵 Tu pedido está en camino</p>
              )}
              <p className="text-dorado-oscuro text-xs mt-2">
                Total a pagar al recibir: ${liveOrder?.total?.toLocaleString('es-CO')}
                {liveOrder?.preferredPayment ? ` · ${PAYMENT_METHOD_LABELS[liveOrder.preferredPayment]}` : ''}
              </p>
            </div>

            <p className="text-dorado-oscuro text-xs mt-3">
              Esta página se actualiza sola con el estado de tu pedido.
            </p>

            <button
              onClick={closeConfirmation}
              className="w-full mt-4 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-4 rounded"
            >
              Seguir pidiendo
            </button>
          </div>
        </div>
      )}

      {/* Footer con información del restaurante */}
      <footer className="bg-surface-2 border-t border-dorado-oscuro/30 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
            {/* Logo */}
            <div className="flex flex-col items-center sm:items-start gap-3">
              <Logo size={64} />
              <p className="text-dorado-oscuro text-xs tracking-[0.3em] uppercase">
                Comida oriental colombiana
              </p>
            </div>

            {/* Contacto */}
            <div className="space-y-2 text-sm">
              <p className="text-dorado font-cormorant text-lg mb-3">Contáctanos</p>
              <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
                <FaMapMarkerAlt className="text-dorado shrink-0" aria-hidden="true" />
                Calle Principal #12-34, Simón
              </p>
              <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
                <FaPhoneAlt className="text-dorado shrink-0" aria-hidden="true" />
                (601) 555-0123
              </p>
              <p className="text-dorado-claro flex items-center justify-center sm:justify-start gap-2">
                <FaClock className="text-dorado shrink-0" aria-hidden="true" />
                Lun a Dom · 11:00 a.m. – 10:00 p.m.
              </p>
            </div>

            {/* Mensaje */}
            <div className="text-center sm:text-right">
              <p className="text-dorado font-cormorant text-xl mb-2">
                ¡Gracias por su visita!
              </p>
              <p className="text-dorado-oscuro text-sm tracking-widest mb-3">
                謝謝 · XIE XIE
              </p>
              <p className="text-dorado-oscuro text-xs flex items-center justify-center sm:justify-end gap-1">
                Hecho con <FaHeart className="text-rojo" aria-hidden="true" /> en Simón
              </p>
            </div>
          </div>

          {/* Decoración */}
          <div className="flex justify-center mt-8 space-x-8 items-center" aria-hidden="true">
            <span className="text-2xl">🏮</span>
            <span className="text-dorado/60 text-sm">福 禄 寿</span>
            <span className="text-2xl">🏮</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MenuPage;