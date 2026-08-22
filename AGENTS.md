# DIS_WOK - AGENTS.md

> **Project ID:** `dis_wok-distrito-wok-simon`
> **Firebase:** `distrito-wok-simon`

## Contexto del Proyecto
Sistema de gestión integral para restaurante de comida oriental colombiana.

## 📍 Ubicación
- **Directorio principal:** `C:\Users\jadies\restaurante\`
- **Repositorio:** https://github.com/JA10S/Distrito-Wok-Simon
- **Firebase:** https://console.firebase.google.com/project/distrito-wok-simon

## 🏗️ Arquitectura
- **Frontend:** React 18 + Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **Pagos:** Bold API
- **Notificaciones:** WhatsApp Business + FCM

## 📁 Estructura del Proyecto
```
src/
├── components/     # Componentes reutilizables
├── pages/          # Páginas por rol (admin, cashier, waiter, delivery, client)
├── contexts/       # React Context (AuthContext)
├── hooks/          # Custom hooks (useMenu, usePayment)
├── services/       # APIs externas (Firebase, Bold, WhatsApp)
├── utils/          # Utilidades (helpers, constants, validations)
└── config/         # Configuración Firebase

scripts/
├── generate-pdf-from-firestore.js  # Genera PDF desde Firestore
├── migrate-to-collections.js       # Migración inicial
└── update-porciones.js             # Actualizar porciones
```

## 🎨 Diseño
- **Colores:** Dorado (#D4A843), Negro (#0d0d0d), Rojo (#C40F0F)
- **Fuentes:** Cormorant Garamond (títulos), Montserrat (cuerpo)
- **Estilo:** Tailwind CSS

## 🔑 Credenciales
- **Firebase:** Configuradas en `src/config/firebase.js`
- **Bold:** Pendiente (ver `docs/INTEGRATION_GUIDE.md`)

## 🧾 REGLA - Cuenta GitHub (obligatoria)

> **Todos los cambios de este proyecto se guardan en la cuenta GitHub `JA10S`.**
> La identidad git del repo está configurada localmente para usar:
> `JA10S <55547937+JA10S@users.noreply.github.com>`
>
> - No cambiar `user.name`/`user.email` en este repo.
> - El push/PR debe autenticarse con la cuenta **JA10S**: verifica con `gh auth status`
>   y cambia con `gh auth switch` si está activa otra cuenta.
> - La cuenta `jadies2024` solo tiene lectura sobre el repo; no intentar pushear con ella.
> - El agente `repo-manager` verifica esta regla antes de cada commit/PR.

## 📋 Comandos
```bash
npm start          # Desarrollo
npm run build      # Build producción
firebase deploy    # Desplegar
npm test           # Tests
```

## 🎯 Roles de Usuario
| Rol | Archivo | Función |
|-----|---------|---------|
| Cliente | `pages/client/MenuPage.js` | Menú público |
| Camarero | `pages/waiter/WaiterDashboard.js` | Tomar pedidos |
| Cajero | `pages/cashier/CashierDashboard.js` | Cobrar |
| Domiciliario | `pages/delivery/DeliveryDashboard.js` | Entregas |
| Admin | `pages/admin/AdminDashboard.js` | Gestión total |

## 📚 Documentación
- `docs/ARCHITECTURE.md` - Arquitectura mixta Firebase + PostgreSQL
- `docs/DATABASE_STRUCTURE.md` - Estructura Firestore
- `docs/INTEGRATION_GUIDE.md` - Guía de integración
- `docs/PROJECT_STRUCTURE.md` - Estructura para IA

## ⚠️ REGLA IMPORTANTE - ACTUALIZACIÓN DE MENÚS

> **Fuente única de verdad: Firestore**
> Los precios se actualizan UNA VEZ en Firestore y se reflejan en web y PDF.

### 📊 Estructura Firestore:
```
Firestore
├── arroces/        → 17 documentos
├── corrientes/     → 9 documentos
├── porciones/      → 7 documentos
└── bebidas/        → 15 documentos
```

### 🔄 Flujo de actualización del menú:
```
1. Actualizar precios en Firestore Console
   https://console.firebase.google.com/project/distrito-wok-simon/firestore

2. La web se actualiza automáticamente (useMenu.js lee de Firestore)

3. Generar PDF actualizado:
   node scripts/generate-pdf-from-firestore.js

4. Subir PDF a Google Drive (opcional)
```

### 📋 Comandos disponibles:
```bash
# Generar PDF desde Firestore
node scripts/generate-pdf-from-firestore.js

# Build y deploy (solo si cambia código React)
npm run build
firebase deploy --only hosting

# Project Harness (tools/harness.ps1)
.\tools\harness.ps1 status     # Estado del proyecto
.\tools\harness.ps1 test       # Tests en modo CI
.\tools\harness.ps1 doctor     # Verifica bugs conocidos
.\tools\harness.ps1 pdf        # Regenera el PDF del menú
.\tools\harness.ps1 seed       # Inicializa roles en Firestore
.\tools\harness.ps1 validate   # Estructura + datos en Firestore
.\tools\harness.ps1 deploy     # Build y deploy
.\tools\harness.ps1 build      # Solo build
.\tools\harness.ps1 clean      # Limpia build y cache
.\tools\harness.ps1 reset      # Clean + npm install + build
.\tools\harness.ps1 dashboard  # Resumen del proyecto
.\tools\harness.ps1 help       # Ayuda completa
```

### 📁 Archivos del menú:
| Archivo | Tipo | Fuente |
|---------|------|--------|
| Firestore collections | Base de datos | arroces, corrientes, porciones, bebidas |
| `src/hooks/useMenu.js` | Hook | Lee de Firestore |
| `src/pages/client/MenuPage.js` | Web | Usa useMenu() |
| `scripts/generate-pdf-from-firestore.js` | Script PDF | Lee de Firestore |
| `menu-distrito-wok-simon-actualizado.pdf` | PDF | Generado desde Firestore |

### 🔒 Reglas Firestore (menú):
```
match /arroces/{itemId} {
  allow read: if true;      // Público
  allow write: if request.auth != null;  // Solo autenticados
}
// Igual para corrientes, porciones, bebidas
```

## 📌 Otras Notas
- **Firebase:** Configurado y funcionando
- **Hosting:** https://distrito-wok-simon.web.app
- **Firestore:** southamerica-east1 (São Paulo)
- **Menú:** 48 items en Firestore (colecciones separadas)
- **PDF:** Se genera desde Firestore con `node scripts/generate-pdf-from-firestore.js`
- **Reglas Firestore:** Lectura pública, escritura solo autenticados

## 🚀 Estado del Proyecto

### ✅ Completado:
- [x] Firebase Hosting desplegado
- [x] Firestore Database habilitada (southamerica-east1)
- [x] Menú migrado a Firestore (48 items, 4 colecciones)
- [x] MenuPage.js conectado a Firestore (useMenu.js)
- [x] Script de generación PDF desde Firestore
- [x] Reglas de seguridad configuradas
- [x] Sistema de autenticación con roles
- [x] Login con redirección por rol
- [x] PrivateRoute para rutas protegidas
- [x] Admin Dashboard con gestión completa
- [x] Gestión de menú (CRUD) desde admin
- [x] Gestión de roles y permisos
- [x] Gestión de usuarios con múltiples roles
- [x] Menú público con filtro de disponibilidad
- [x] Menú en tiempo real (onSnapshot)
- [x] Botón "Volver al Panel" para admin en dashboards
- [x] Sistema de permisos por funcionalidad
- [x] Documento de lecciones aprendidas (AGENTS.md)

### 📋 Pendiente:
- [ ] Integrar pagos Bold
- [ ] Configurar WhatsApp Business API
- [ ] Conectar CashierDashboard a Firestore (datos hardcodeados)
- [ ] Conectar DeliveryDashboard a Firestore (datos hardcodeados)
- [ ] Crear flujo completo de pedidos en WaiterDashboard
- [ ] Crear componente de inventario
- [x] Smoke tests básicos (App, Login, Menu)
- [ ] Ampliar cobertura de tests

### ✅ Bugs Resueltos (2026-08-22):
1. ~~**pushNotification.js**: Import de `messaging` no existe en firebase.js~~ → firebase.js ahora exporta `messaging`
2. ~~**useRoles.js**: `updateRole()` retorna boolean, pero componentes esperan `{ success: true }`~~ → hooks retornan `{ success, error }`
3. ~~**create-users.js**: Usa `role` (string) en vez de `roles` (array)~~ → usa `roles` (array)
4. ~~**migrate-menu.js**: Script obsoleto (usa colección única 'menu')~~ → escribe en colecciones separadas

### 🐛 Bugs Conocidos:
_Sin bugs conocidos pendientes. Verificar con `.\tools\harness.ps1 doctor`_

---

## 🧠 LECCIONES APRENDIDAS (Errores a no repetir)

### 1. **Firestore: Nombres de campos en inglés**
> Los campos en Firestore usan **nombres en inglés**: `name`, `price`, `description`, `available`
> NO usar español: `nombre`, `precio`, `descripcion`, `disponible`
```javascript
// ❌ MAL
{ nombre: 'Arroz', precio: '26K', disponible: true }

// ✅ BIEN
{ name: 'Arroz', price: '26K', available: true }
```

### 2. **Sistema de roles: Usar array, no string**
> El campo `roles` es un **array** (un usuario puede tener múltiples roles)
```javascript
// ❌ MAL
{ role: 'Administrador' }

// ✅ BIEN
{ roles: ['admin', 'waiter'] }
```

### 3. **Nombres de roles: En inglés, minúsculas**
> Roles en inglés: `admin`, `waiter`, `cashier`, `delivery`
> NO usar español: `Administrador`, `Camarero`, `Cajero`, `Domiciliario`
```javascript
// ❌ MAL
allowedRoles={['Administrador', 'Camarero']}

// ✅ BIEN
allowedRoles={['admin', 'waiter']}
```

### 4. **PrivateRoute: Usar userRoles (plural)**
> AuthContext expone `userRoles` (array), NO `userRole` (string)
```javascript
// ❌ MAL
const { userRole } = useAuth();

// ✅ BIEN
const { userRoles } = useAuth();
```

### 5. **Menú: Filtrar productos no disponibles**
> Siempre filtrar por `available !== false` al mostrar menú público
```javascript
// ❌ MAL
{menu.arroces.map(item => ...)}

// ✅ BIEN
{menu.arroces.filter(item => item.available !== false).map(item => ...)}
```

### 6. **Hooks: Usar onSnapshot para tiempo real**
> Para datos que cambian frecuentemente (menú, pedidos), usar `onSnapshot` no `getDocs`
```javascript
// ❌ MAL - Carga una sola vez
const snapshot = await getDocs(query(collectionRef));

// ✅ BIEN - Actualización en tiempo real
onSnapshot(query(collectionRef), (snapshot) => { ... });
```

### 7. **Firestore Rules: Temporal para scripts de inicialización**
> Para scripts que inicializan datos, abrir permisos temporalmente:
```javascript
// Temporal
match /users/{userId} {
  allow read, write: if true;
}

// Después restaurar
match /users/{userId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

### 8. **Login: Retornar roles del login**
> El login debe retornar los roles para navegar correctamente
```javascript
// En AuthContext - login retorna roles
const result = await signInWithEmailAndPassword(auth, email, password);
const userData = await getUserData(result.user.uid);
return { ...result, roles: userData.roles };

// En LoginPage - usar roles retornados
const result = await login(email, password);
if (result.roles.includes('admin')) navigate('/admin');
```

### 9. **Consola: No dejar console.log en producción**
> Eliminar todos los `console.log` antes de deploy
```bash
# Buscar console.log
grep -r "console.log" src/

# O usar ESLint rule
"no-console": "warn"
```

### 10. **Deploy: Siempre hacer build después de cambios**
```bash
npm run build
firebase deploy --only hosting
```

### 11. **Caché del navegador: Hard refresh después de deploy**
> Si el usuario no ve cambios: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)

### 12. **Estructura de datos Firestore: Documentar**
> Siempre verificar la estructura real antes de escribir código:
```bash
# Script para verificar datos
node -e "
const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection } = require('firebase/firestore');
// ... verificar estructura
"
```

---

## 📊 Estructura Actual del Sistema

### Roles y Permisos
```
users/{uid}
├── uid: string
├── email: string
├── name: string
└── roles: ['admin', 'waiter', ...]

roles/{roleId}
├── name: string
└── permissions: ['create_order', 'view_menu', ...]
```

### Permisos Disponibles
| Permiso | Descripción |
|---------|-------------|
| `create_order` | Crear pedidos |
| `view_menu` | Ver menú |
| `update_order_status` | Cambiar estado |
| `close_table` | Cerrar mesas |
| `charge_orders` | Cobrar |
| `view_history` | Ver historial |
| `cash_register` | Cuadre de caja |
| `view_deliveries` | Ver entregas |
| `update_delivery_status` | Cambiar estado entrega |
| `mark_as_delivered` | Marcar entregado |
| `view_dashboard` | Ver panel admin |
| `manage_menu` | Gestionar menú |
| `manage_users` | Gestionar usuarios |
| `manage_permissions` | Gestionar permisos |
| `view_reports` | Ver reportes |

### Usuarios de Prueba
| Email | Rol | UID |
|-------|-----|-----|
| admin@distritowok.com | admin | elcAjAF32oRaiZnRjObC42UyRmp2 |
| camarero@distritowok.com | waiter | vPKSt5bHqvg8fMJ6M7T8vQcP2gJ3 |
| cajero@distritowok.com | cashier | aOSpaR4Qk9RV76KEJGrAnPrWp9m1 |
| domicilio@distritowok.com | delivery | xk85WniinQa1KE5LjJBxw5gVxbh1 |

---

## 📁 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `src/contexts/AuthContext.js` | Autenticación y roles |
| `src/components/auth/PrivateRoute.js` | Rutas protegidas |
| `src/hooks/useMenu.js` | Menú público (tiempo real) |
| `src/hooks/useMenuAdmin.js` | Gestión menú admin (CRUD) |
| `src/hooks/useRoles.js` | Gestión roles y usuarios |
| `src/components/admin/MenuManager.js` | Interfaz gestión menú |
| `src/components/admin/RolesManager.js` | Interfaz gestión roles |
| `src/components/admin/UsersManager.js` | Interfaz gestión usuarios |
| `src/pages/auth/LoginPage.js` | Login con redirección |
| `firestore.rules` | Reglas de seguridad |

---

## 📊 Resumen de Sesión (Última actualización: 2026-08-10)

### Cambios Realizados en Esta Sesión:
1. **Sistema de roles y permisos** - Migrado de `role` (string) a `roles` (array)
2. **Admin Dashboard** - Panel completo con gestión de menú, roles y usuarios
3. **Menú en tiempo real** - Cambiado de `getDocs` a `onSnapshot`
4. **Filtro de disponibilidad** - Menú público solo muestra productos disponibles
5. **Login corregido** - Retorna roles para redirección correcta
6. **PrivateRoute actualizado** - Usa `userRoles` (plural) y nombres en inglés
7. **Botón volver** - Agregado en dashboards para admin
8. **Documento AGENTS.md** - Actualizado con lecciones aprendidas

### Archivos Modificados:
- `src/contexts/AuthContext.js` - Sistema de roles y permisos
- `src/components/auth/PrivateRoute.js` - Verificación de roles
- `src/pages/auth/LoginPage.js` - Redirección por roles
- `src/App.js` - Rutas con roles en inglés
- `src/pages/client/MenuPage.js` - Filtro de disponibilidad
- `src/hooks/useMenu.js` - Tiempo real con onSnapshot
- `src/hooks/useMenuAdmin.js` - CRUD para menú
- `src/hooks/useRoles.js` - Gestión de roles y usuarios
- `src/components/admin/MenuManager.js` - Interfaz de gestión
- `src/components/admin/RolesManager.js` - Gestión de roles
- `src/components/admin/UsersManager.js` - Gestión de usuarios
- `src/pages/admin/AdminDashboard.js` - Panel administrativo
- `src/pages/waiter/WaiterDashboard.js` - Botón volver
- `src/pages/cashier/CashierDashboard.js` - Botón volver
- `src/pages/delivery/DeliveryDashboard.js` - Botón volver
- `firestore.rules` - Reglas actualizadas

### Scripts Creados:
- `scripts/init-roles.js` - Inicializa roles en Firestore
- `scripts/init-permissions.js` - Inicializa permisos (obsoleto)

### Métricas Finales:
| Métrica | Valor |
|---------|-------|
| Archivos JS fuente | 27 |
| Componentes | 5 |
| Hooks | 7 |
| Páginas | 6 |
| Servicios | 4 |
| Scripts | 14 |
| State | Production Ready (core)