import React, { useState } from 'react';
import { useRoles } from '../../hooks/useRoles';

const ALL_PERMISSIONS = {
  create_order: 'Crear Pedidos',
  view_menu: 'Ver Menú',
  update_order_status: 'Cambiar Estado de Pedidos',
  close_table: 'Cerrar Mesas',
  charge_orders: 'Cobrar Pedidos',
  view_history: 'Ver Historial',
  cash_register: 'Cuadre de Caja',
  view_deliveries: 'Ver Entregas',
  update_delivery_status: 'Cambiar Estado de Entrega',
  mark_as_delivered: 'Marcar como Entregado',
  view_dashboard: 'Ver Panel',
  manage_menu: 'Gestionar Menú',
  manage_users: 'Gestionar Usuarios',
  manage_permissions: 'Gestionar Permisos',
  view_reports: 'Ver Reportes'
};

const ROLE_ICONS = {
  admin: '👑',
  waiter: '🍽️',
  cashier: '💰',
  delivery: '🛵'
};

function RolesManager() {
  const { roles, loading, updateRole } = useRoles();
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (roleId) => {
    setEditingRole(roleId);
    setShowForm(true);
    setError('');
  };

  const handleSavePermissions = async (roleId, permissions) => {
    setSaving(true);
    const result = await updateRole(roleId, permissions);
    setSaving(false);
    
    if (!result.success) {
      setError('Error al guardar: ' + result.error);
    }
  };

  const handleTogglePermission = (roleId, permissionId, currentPermissions) => {
    let newPermissions;
    if (currentPermissions.includes(permissionId)) {
      newPermissions = currentPermissions.filter(p => p !== permissionId);
    } else {
      newPermissions = [...currentPermissions, permissionId];
    }
    handleSavePermissions(roleId, newPermissions);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-bounce">🏮</div>
        <p className="text-dorado">Cargando roles...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-cormorant text-dorado">Gestión de Roles</h2>
      </div>

      {error && (
        <div className="bg-rojo/20 border border-rojo text-rojo px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(roles).map(([roleId, role]) => (
          <div key={roleId} className="bg-gray-900 rounded-lg p-6 border border-dorado-oscuro/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{ROLE_ICONS[roleId] || '👤'}</span>
                <div>
                  <h3 className="text-lg font-cormorant text-dorado-claro">{role.name}</h3>
                  <p className="text-dorado-oscuro text-sm">{role.permissions?.length || 0} permisos</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(ALL_PERMISSIONS).map(([permId, permName]) => (
                <label key={permId} className="flex items-center space-x-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={role.permissions?.includes(permId) || false}
                    onChange={() => handleTogglePermission(roleId, permId, role.permissions || [])}
                    disabled={saving}
                    className="w-4 h-4 rounded border-dorado-oscuro bg-negro text-dorado focus:ring-dorado"
                  />
                  <span className="text-dorado-claro text-sm">{permName}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-dorado-oscuro text-sm">
          Los cambios se aplican en tiempo real
        </p>
      </div>
    </div>
  );
}

export default RolesManager;
