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

tools/                              # Herramientas del proyecto
├── harness.ps1                      # Project Harness (status/test/pdf/deploy…)
├── harness.bat
└── README.md

.opencode/                          # Configuración para IA (opencode)
├── agents/                         # Agentes: diseno-visual.md
├── skills/                         # Skills: firebase-db-modeler/, ilustraciones-svg/
└── (leer: sección 🤖 Estructura IA más abajo)
```

## 🤖 Estructura IA (agentes, skills y tools)

> Todo lo que la IA necesita para extender el proyecto está agrupado y documentado.

| Tipo | Carpeta | Contenido |
|------|---------|-----------|
| **Agentes** | `.opencode/agents/<nombre>.md` | Subagentes con frontmatter (`description`, `mode`) y prompt en el cuerpo. Actual: `diseno-visual` (UI/estilo) |
| **Skills** | `.opencode/skills/<nombre>/SKILL.md` | Conocimiento reutilizable con frontmatter `name` (igual a la carpeta) + `description`. Actual: `firebase-db-modeler`, `ilustraciones-svg` |
| **Tools** | `tools/` | Scripts del proyecto: `harness.ps1` (+ `harness.bat`, `README.md`) |
| **Config** | `opencode.json` | `skills.paths` (`.opencode/skills`) + `instructions: ["AGENTS.md"]` |

**Reglas:**
- Nuevos agentes → `.opencode/agents/<nombre>.md` (nunca inline en opencode.json salvo trivialidades).
- Nueva skill → `.opencode/skills/<nombre>/SKILL.md` con `name` = carpeta, `description` en tercera persona con palabras clave de activación.
- Tras cambiar `opencode.json`, agentes o skills: **reiniciar opencode** para que recargue la config.
- Documentar cualquier creación aquí y en `docs/PROJECT_STRUCTURE.md` (árbol con `.opencode/` y `tools/`).

## 🎨 Diseño
- **Colores:** Dorado (#D4A843), Negro (#0d0d0d), Rojo (#C40F0F)
- **Fuentes:** Cormorant Garamond (títulos), Montserrat (cuerpo), Inter (datos numéricos/UI de dashboards)
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
- [x] Flujo completo de pedidos en WaiterDashboard (permisos, mesas, cobro)

### 📋 Pendiente:
- [ ] Integrar pagos Bold
- [ ] Configurar WhatsApp Business API
- [x] Conectar CashierDashboard a Firestore
- [x] Conectar DeliveryDashboard a Firestore (hook useDeliveries, colección deliveries)
- [x] Crear flujo completo de pedidos en WaiterDashboard
  - `useOrders` filtra pedidos activos (`pending|preparing|ready`), ordena por `createdAt` y guarda `paymentStatus`/`cashierId`
  - `processPayment` (cajero) libera la mesa automáticamente si `tables.currentOrderId` coincide
  - `createOrder` guarda `waiterId`/`waiterName`; `tables.currentOrderId` se registra al ocupar
  - Permisos verificados en UI: `create_order`, `update_order_status`, `close_table`
  - Mesa ocupada → clic abre el pedido activo (agregar items = continuar pedido)
  - Botón "Cerrar mesa" para mesas ocupadas sin pedido activo
  - Cancelar directo desde la tarjeta, solo para pedidos `pending` (aún no entrados en cocina)
  - Cancelación en cocina (`preparing`): solo admin (`view_dashboard`) con motivo obligatorio; `ready` no se cancela
  - `cancelOrder` guarda `cancelledFromStatus`, `cancelledBy/Name`, `cancelledReason`
  - Aviso de duplicado al crear pedido: compara items con cancelados de los últimos 30 min (`src/utils/orderUtils.js`)
  - Panel "Cancelados recientes" con botón **♻️ Reactivar** (vuelve a `pending`/`preparing` y re-ocupa la mesa)
  - Panel de cancelados también en AdminDashboard (avisar a cocina)
  - Tests: `src/pages/waiter/WaiterDashboard.test.js` (12 casos) + `src/utils/orderUtils.test.js` (8 casos)
- [x] Pedidos "para llevar" (domicilio o recoger en local) — camarero y cliente web
  - Modelo: `type: 'table'|'delivery'|'pickup'`, `tableId: null`/`tableNumber: 0` en no-mesa, `customer {name, phone, address, reference, notes}`, `preferredPayment: 'cash'|'nequi'|'card'`, `source: 'client'|'waiter'`
  - `src/utils/orderUtils.js`: `ORDER_TYPE_LABELS`, `PAYMENT_METHOD_LABELS/OPTIONS`, `parsePrice`, `calculateTotals` (IVA 10%), `validateCustomerInfo` (nombre, teléfono ≥7 dígitos, dirección solo en `delivery`)
  - `src/services/orderService.js`: `createTakeawayOrder` (addDoc para invitados) + `watchOrder` (onSnapshot de seguimiento)
  - `OrderCreator`: pestañas "🍽️ En mesa" / "🥡 Para llevar" con formulario (nombre, teléfono, dirección, referencia, pago preferido, notas)
  - `WaiterDashboard`: `updateTableStatus` solo se ejecuta si el pedido tiene `tableId`; `OrderCard` muestra tipo + datos del cliente
  - `useOrders.updateOrderStatus`: al pasar a `ready` con `type='delivery'` crea doc en `deliveries` y guarda `deliveryId` (puente cocina → domiciliario); `cancelOrder`/`reactivateOrder` sincronizan la entrega vinculada
  - `MenuPage`: carrito flotante, checkout (domicilio/recoger, pago preferido), modal de confirmación con **estado en vivo** vía `watchOrder`
  - `CashierDashboard`: etiqueta de tipo de pedido + teléfono/dirección/pago preferido
  - `firestore.rules`: `orders` con `get: if true` (seguimiento público), `list` autenticado, `create` para invitados solo con payload `delivery|pickup` validado
  - Tests: 37 totales (`MenuPage.test` 4 casos, `orderUtils.test` 14 casos)
- [x] Personalización de apariencia por el administrador (fuentes y colores)
  - Admin → pestaña **🎨 Apariencia**: selectores de color (dorado, dorado claro/oscuro, rojo, rojo oscuro, fondo) + tipografías de títulos y cuerpo con vista previa en vivo
  - `tailwind.config.js`: colores ahora son `rgb(var(--color-*) / <alpha-value>)`; `font-cormorant`/`font-montserrat` usan `var(--font-heading)`/`var(--font-body)` (los modificadores de opacidad `/20` siguen funcionando)
  - `src/App.css`: `:root` con variables por defecto (mismos hex de siempre) + Google Fonts ampliado (Cormorant Garamond, Playfair Display, Lora, Montserrat, Poppins, Lato)
  - `src/utils/themeUtils.js`: `DEFAULT_THEME`, `COLOR_FIELDS`, `HEADING_FONTS`, `BODY_FONTS`, `hexToRgbChannels`, `sanitizeTheme` (valida hex y fuentes), `applyTheme` (escribe las CSS vars)
  - `src/contexts/ThemeContext.js`: `ThemeProvider` escucha `settings/theme` con `onSnapshot` (aplica a todas las páginas en tiempo real, incluido menú público) + `saveTheme`/`resetTheme`
  - Sin documento en Firestore → se usan los valores por defecto; cambios sin guardar se descartan al salir de la pestaña
  - `firestore.rules` sin cambios: `settings` ya era lectura pública y escritura autenticada
  - Tests: 49 totales (`themeUtils.test` 7 casos, `ThemeManager.test` 4 casos)
- [x] Rediseño visual: logo propio, iconos y layouts responsive
  - **Logo**: SVG propio de sello circular con wok y vapor — `src/components/common/Logo.js` (`LogoMark` + variante `showText` con wordmark en degradado dorado) y `public/assets/icons/logo.svg` (favicon; `index.html` ya no referencia el `favicon.ico` inexistente)
  - **`DashboardHeader`** (`src/components/layout/DashboardHeader.js`): header+nav común para los 4 dashboards (logo, título, email, cerrar sesión, tabs con iconos de `react-icons`, badge de conteo, botón ← Admin, nav sticky con `backdrop-blur` y `no-scrollbar`)
  - **Iconos**: `react-icons` (ya estaba en dependencies) — `Fa*`, `Gi*` (secciones del menú), `Tb*`; nada de librerías nuevas
  - **CSS dinámico** (`App.css`): `.hover-lift`, `.text-gold-gradient`, `.glass`, `.pattern-bg`, `.glow`, `.animate-fade-in-up`, `.animate-float`, `.no-scrollbar`
  - **LoginPage**: layout 2 columnas en desktop (marca + features con iconos) y 1 en móvil, iconos dentro de los inputs, spinner en botón
  - **MenuPage**: header con logo grande + gradiente + patrón, nav glass, badges de icono por sección, cards con `hover-lift`, FAB de carrito con contador, footer de 3 columnas (logo, contacto, agradecimiento) responsive
  - **AdminDashboard**: stats cards con iconos + animación de entrada, tabs con iconos, dashboards por rol con `hover-lift`
  - Google Fonts unificados en `public/index.html` (6 familias del tema); `App.css` ya no tiene `@import`
  - Tests: 49 totales sin cambios (textos clave conservados)
- [x] Resúmenes (estadísticas) en todos los dashboards — permiso administrable
  - Nuevo permiso **`view_summaries`** en `RolesManager.ALL_PERMISSIONS` ("Ver Resúmenes (Estadísticas)") — el admin lo activa/desactiva por rol desde la pestaña Roles
  - Componente compartido `src/components/common/SummaryStats.js` (grid 2/4 columnas, icono + valor, `hover-lift` + animación de entrada escalonada); AdminDashboard ahora lo reutiliza
  - **Camarero**: mesas disponibles/ocupadas, pedidos activos/listos — gated por `hasPermission('view_summaries')`
  - **Cajero**: por cobrar, cobrado hoy (`timestampMs` sobre `createdAt`), pagados hoy, total pagados
  - **Domiciliario**: disponibles, mis entregas activas, entregadas, total pedidos
  - Sin el permiso no se muestra nada (comportamiento por defecto de todos los roles)
  - Unificación de estilo del contenido: `hover-lift` en tarjetas (mesas, pedidos, cobros, entregas) y empty states con icono (`FaInbox`/`FaHistory`/`FaBoxOpen`)
  - Tests: 51 totales (2 nuevos en `WaiterDashboard.test` verificando el gating de `view_summaries`)
- [x] Imagen de referencia en el login + efectos animados (decisión del usuario: usar su imagen en lugar del SVG)
  - `public/assets/images/login-chef.jpg` (704KB, imagen del chef con wok en llamas — aportada por el usuario; también dejó `Logo_actualizado.png` sin usar aún)
  - `LoginPage`: desktop 430px / móvil 270px con `mix-blend-mode: lighten` (funde bordes con el fondo negro), **máscara de viñeta** (`mask-image: radial-gradient` en `.login-chef`) que deshace los bordes rectos, **zoom lento** (16s, `login-chef-zoom`) y **resplandor dorado pulsante** sobre el fuego (`.login-chef::after` con `mix-blend-mode: screen`, `login-chef-flicker`); `prefers-reduced-motion` respetado
  - **Fallback**: si la imagen no carga (`onError`), se muestra el SVG animado `ChefAnimation` (versión limpia: silueta sólida dorada, 3 capas de fuego, 5 chispas, 3 trozos de comida, mesa atenuada 50%)
  - `src/App.css`: bloque "Imagen de referencia en el login" + bloque "Ilustración animada" (clases `chef-*`)
  - Skill asociada: `.opencode/skills/ilustraciones-svg/SKILL.md`; agente: `.opencode/agents/diseno-visual.md`
  - Tests: 51 totales sin cambios
- [x] Login rediseñado (feedback de diseño del usuario)
  - **Glassmorphism**: tarjeta del formulario `bg-black/60 backdrop-blur-md border-dorado/25 rounded-2xl` (reemplaza `bg-gray-900` azulado)
  - **Inputs mate oscuros**: `bg-black/50`, texto blanco, iconos dorado/70, placeholder dorado apagado, `rounded-lg`; CSS `.login-input:-webkit-autofill` fuerza fondo oscuro (evita el blanco del autocompletado del navegador)
  - **Tipografía unificada**: labels, subtítulo ★ y lista de características en `font-cormorant` (serif gourmet); el texto de los inputs queda en Montserrat (combinación serif+sans limpia)
  - **Botón metálico**: clase `.btn-gold` con degradado `dorado-claro → dorado → dorado-oscuro` (background-size 170%, hover mueve el gradiente), sombra dorada, `rounded-xl`, hover lift sutil
  - **Layout 50/50 fluido**: `max-w-6xl gap-12` — izquierdo: imagen a 540px (antes 430) + marca `text-5xl/6xl` + features; derecho: solo el formulario (aire)
- [x] Login premium final (brief del usuario, 2026-09-30)
  - **Split-screen**: izquierda = sección de marca con la ilustración como FONDO (`BrandArt`, `object-cover object-[40%_center]`, velo `bg-negro/45` + `login-brand-text` con text-shadow); logo `font-cormorant text-6xl` + eslogan `* SABOR QUE ENAMORA *`; **sin lista de características** (quitada para mantenerlo minimalista)
  - **Semántica**: `main` + `section aria-label` (marca) + `form`; mobile apilado conserva marca compacta + eslogan
  - **Animaciones de carga** (App.css): `.login-brand` fade 0→1 en 0.8s; `.login-form` slide-up `translateY(20px→0)` en 1s con delay 0.2s (ambas con `both`, respetan `prefers-reduced-motion`)
  - **Microinteracciones inputs**: `.login-input:focus` → borde dorado + doble `box-shadow` (ring + glow) con transición 0.3s
  - **Botón `.btn-gold`**: hover `translateY(-2px) scale(1.02)` + `brightness(1.06)` + sombra más viva; active `scale(0.98)`
  - Tests: 51 totales (sin cambios)
- [x] Nuevo logo oficial aplicado (2026-09-30)
  - Fuente: `public/assets/images/Logo_actualizado.png` (300×191, fondo marino, wordmark dorado "Distrito Wok Simón - Restaurante Chino")
  - `src/components/common/Logo.js`: `Logo` ahora renderiza el PNG (alto = prop `size`, `rounded-lg border-dorado/15`); `LogoMark` (sello SVG) se conserva exportado como icono auxiliar
  - Usos: `DashboardHeader` (44px), `MenuPage` header (80/90/120px) y footer (64px), login desktop (320px dentro de `<h1>`) y móvil (220px)
  - Favicon de `public/index.html`: ahora apunta al PNG (antes `logo.svg`)
- [x] Rediseño premium del Panel de Administración (propuestas UI/UX, 2026-09-30)
  - **Navbar** (`DashboardHeader`): fondo `bg-negro` puro + borde inferior dorado; botón "Cerrar Sesión" carmesí quemado (`#6e1414` → hover `#8a1d1d`, borde/carbón oscuro, no rojo brillante)
  - **Pestañas**: activa con clase `.tab-active` (text-shadow dorado + línea inferior en degradado con glow via `::after`); inactivas `text-dorado-oscuro hover:text-dorado-claro`; nav `bg-negro/95 backdrop-blur`
  - **Acceso Rápido**: botones `quick-card` (CSS con var `--role` = canales RGB) — fondo carbón `rgb(255 255 255 / 0.04)`, borde/icono/texto en color del rol (Camarero verde `34 197 94`, Cajero azul `59 130 246`, Domiciliario dorado `212 168 67`), hover: lift + glow del rol + borde encendido; respeta `prefers-reduced-motion`
  - **Cards unificadas**: `SummaryStats` y contenedor de "Últimos Pedidos" usan exactamente `bg-gray-900 rounded-xl border border-dorado-oscuro/25`; números con `font-inter text-3xl font-semibold tabular-nums` y colores de estado suaves (emerald-400, rose-400, amber-300, dorado)
  - **Últimos Pedidos**: filas `px-5 py-4`, montaje en Inter, estado como pill (`rounded-full` translúcido con borde del color: amber=pending, sky=preparing, dorado=ready, red=cancelled) + pill verde `paid` si `paymentStatus === 'paid'`
  - **Tipografía**: Inter agregada a Google Fonts (index.html) + `fontFamily.inter` en `tailwind.config.js`; serif solo en títulos
  - Mismo estilo de `quick-card` aplica en la pestaña Dashboards ("Abrir Panel")
  - Tests: 51 totales (sin cambios)
- [x] Camarero Fase 1 — corrección de bugs críticos (2026-09-30)
  - **Edición en cocina bloqueada**: `handleTableClick`/`handleEditOrder` (WaiterDashboard) y `handleSave` (OrderEditor) exigen `status === 'pending'`; `useOrders.updateOrder` además valida el estado en servidor (getDoc previo)
  - **Salida para pedidos `ready`**: botón "✕ Cancelar listo" en OrderCard (solo con `view_dashboard`), `handleCancelOrder` trata `ready` como cocina (admin + motivo obligatorio); `reactivateOrder` restaura `preparing`/`ready` según `cancelledFromStatus`
  - **`parsePrice` unificado** en `orderUtils.js` (acepta `30K`, `30K / 40K`, `$4.500`, `4500`, número) — eliminadas las 2 copias locales de OrderCreator/OrderEditor; $4.500 ya no cobraba 4000
  - **Escrituras validadas**: `updateTableStatus` se verifica en crear/cancelar/reactivar (alert si falla) y se muestra banner de error de `tablesError`/`ordersError` en pantalla; eliminada la rama `paid` muerta de `handleStatusChange`
  - **Carrito seguro**: `OrderCreator.handleConfirm` es async y limpia el carrito solo si `onConfirmOrder` retorna `{success:true}`
  - **Ciclo pago/delivery**: `processPayment` escribe `paymentStatus:'paid'` (antes `'completed'`, el pill del admin nunca aparecía) y sincroniza `deliveries.paymentStatus`; `markDelivered` escribe `deliveredAt` en la order vinculada
  - Tests: 57 totales (6 nuevos: 5 parsePrice en orderUtils + 3 de WaiterDashboard — editor bloqueado en cocina, cancelar `ready` con admin/motivo, botón oculto sin `view_dashboard`)
- [x] Camarero Fase 2 — funcionalidades nuevas (2026-09-30)
  - **Cobro en mesa por el camarero**: permiso `charge_orders` + botón "💵 Cobrar" en OrderCard (solo `ready` y `type !== 'delivery'`) → modal con Efectivo/Nequi/Tarjeta que llama `processPayment` (libera mesa y sincroniza pago con la delivery vinculada)
  - **Filtros por tipo** en pestaña Pedidos: chips Todos/Mesa/Domicilio/Recoger con conteos (`typeFilter`, items sin `type` se tratan como `table`)
  - **`getOrderLabel`** movido de CashierDashboard a `orderUtils.js` — fin de los "Mesa 0"/undefined: se usa en mensajes de duplicados, cancelar, reactivar, cabecera del editor e historial
  - **Selector de tamaño** para precios dobles (`30K / 40K`): `parsePriceOptions` + `resolveItemVariant` en orderUtils; botones "Pequeña $30.000 / Grande $40.000" en OrderCreator y OrderEditor; items guardados con id `base--small|--large` y `size`; `findDuplicateOrder` normaliza esos sufijos al comparar
  - **Historial del camarero**: pestaña `history` con permiso `view_history` — últimos 50 pedidos `paid` (número, label, camarero, método, total) usando `useOrders('paid')`
  - Tests: 62 totales (5 nuevos: cobrar con `charge_orders`, cobro oculto sin permiso, filtro por tipo, historial con/sin permiso)
- [ ] Crear componente de inventario
- [x] Smoke tests básicos (App, Login, Menu)
- [ ] Ampliar cobertura de tests (faltan: CashierDashboard, OrderCreator/Editor, hooks)

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
| `view_summaries` | Ver Resúmenes (Estadísticas) en el dashboard |

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