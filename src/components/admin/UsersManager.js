import React, { useState } from 'react';
import { useRoles, useUsers } from '../../hooks/useRoles';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../services/firebase';

const auth = getAuth(app);

const ROLE_ICONS = {
  admin: '👑',
  waiter: '🍽️',
  cashier: '💰',
  delivery: '🛵'
};

function UsersManager() {
  const { roles } = useRoles();
  const { users, loading, updateUserRoles, createUser } = useUsers();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roles: []
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggleRole = (userId, currentRoles, roleId) => {
    let newRoles;
    if (currentRoles.includes(roleId)) {
      newRoles = currentRoles.filter(r => r !== roleId);
    } else {
      newRoles = [...currentRoles, roleId];
    }
    updateUserRoles(userId, newRoles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email y contraseña son obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const result = await createUser({
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        roles: formData.roles
      });

      setSaving(false);

      if (result.success) {
        setShowForm(false);
        setFormData({ email: '', password: '', name: '', roles: [] });
      } else {
        setError('Error al crear usuario: ' + result.error);
      }
    } catch (err) {
      setSaving(false);
      setError('Error al crear usuario en Auth: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4 animate-bounce">🏮</div>
        <p className="text-dorado">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-cormorant text-dorado">Gestión de Usuarios</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-dorado-oscuro/30">
          <h3 className="text-lg font-cormorant text-dorado-claro mb-4">
            Crear Nuevo Usuario
          </h3>
          
          {error && (
            <div className="bg-rojo/20 border border-rojo text-rojo px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-dorado-oscuro text-sm mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-dorado-oscuro text-sm mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-900 border border-dorado-oscuro/30 rounded px-3 py-2 text-dorado-claro focus:border-dorado focus:outline-none"
                  placeholder="Nombre del usuario"
                />
              </div>
            </div>

            <div>
              <label className="block text-dorado-oscuro text-sm mb-2">Roles</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roles).map(([roleId, role]) => (
                  <label key={roleId} className="flex items-center space-x-2 cursor-pointer bg-gray-900 px-3 py-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(roleId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, roles: [...formData.roles, roleId] });
                        } else {
                          setFormData({ ...formData, roles: formData.roles.filter(r => r !== roleId) });
                        }
                      }}
                      className="w-4 h-4 rounded border-dorado-oscuro bg-negro text-dorado focus:ring-dorado"
                    />
                    <span className="text-dorado-claro text-sm">
                      {ROLE_ICONS[roleId]} {role.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-dorado hover:bg-dorado-oscuro text-negro font-bold py-2 px-6 rounded disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ email: '', password: '', name: '', roles: [] });
                  setError('');
                }}
                className="bg-gray-700 hover:bg-gray-600 text-dorado-claro font-bold py-2 px-6 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-gray-900 rounded-lg border border-dorado-oscuro/20">
        {users.length === 0 ? (
          <p className="text-dorado-oscuro text-center py-8">
            No hay usuarios registrados
          </p>
        ) : (
          <div className="divide-y divide-dorado-oscuro/20">
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-3 md:mb-0">
                    <p className="text-dorado-claro font-medium">{user.email}</p>
                    <p className="text-dorado-oscuro text-sm">{user.name || 'Sin nombre'}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(roles).map(([roleId, role]) => (
                      <label key={roleId} className="flex items-center space-x-2 cursor-pointer bg-gray-800 px-3 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={user.roles?.includes(roleId) || false}
                          onChange={() => handleToggleRole(user.id, user.roles || [], roleId)}
                          className="w-4 h-4 rounded border-dorado-oscuro bg-negro text-dorado focus:ring-dorado"
                        />
                        <span className="text-dorado-claro text-sm">
                          {ROLE_ICONS[roleId]} {role.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-dorado-oscuro text-sm">
          Los roles se asignan directamente desde esta interfaz
        </p>
      </div>
    </div>
  );
}

export default UsersManager;
