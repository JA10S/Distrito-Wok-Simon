import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Misma prioridad de rol → panel que usa el LoginPage al iniciar sesión
const ROLE_PRIORITY = ['admin', 'waiter', 'cashier', 'delivery'];
const PANEL_BY_ROLE = {
  admin: '/admin',
  waiter: '/waiter',
  cashier: '/cashier',
  delivery: '/delivery'
};

/**
 * Acceso directo "Ir a mi panel" en el menú público.
 * Solo se muestra con sesión activa (el personal con la app instalada);
 * los clientes sin sesión no ven nada.
 */
function PanelShortcut() {
  const { currentUser, userRoles } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const role = ROLE_PRIORITY.find((r) => (userRoles || []).includes(r));
  if (!role) return null;

  return (
    <button
      onClick={() => navigate(PANEL_BY_ROLE[role])}
      aria-label="Ir a mi panel"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-3 px-5 rounded-full shadow-[0_8px_24px_-6px_rgb(var(--color-dorado)/0.6)] flex items-center space-x-2 hover-lift animate-fade-in-up"
    >
      <span aria-hidden="true">🏠</span>
      <span className="text-sm">Mi panel</span>
    </button>
  );
}

export default PanelShortcut;
