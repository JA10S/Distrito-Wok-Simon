# DIS_WOK - Restaurante Distrito Wok Simón

> **Project ID:** `dis_wok-distrito-wok-simon`
> **Firebase:** `distrito-wok-simon`
> **Repo:** `github.com/JA10S/Distrito-Wok-Simon`

Sistema de gestión integral para el restaurante **Distrito Wok Simón** - Comida oriental colombiana.

## 📋 Descripción

Aplicación web completa para la gestión de un restaurante, incluyendo:

- **Menú digital** con código QR para clientes
- **Sistema de pedidos** para mesas, domicilios y para llevar
- **Gestión de inventario** y control de stock
- **Sistema de pagos** integrado con Bold
- **Notificaciones** por WhatsApp y push
- **Reportes** de ventas e inventario
- **Gestión de empleados** con roles y permisos

## 🏗️ Arquitectura

```
restaurante/
├── config/                          # Configuraciones
│   └── firebase.js                  # Firebase config
├── docs/                            # Documentación
│   ├── DATABASE_STRUCTURE.md        # Estructura Firestore
│   └── INTEGRATION_GUIDE.md         # Guía de integración
├── public/                          # Archivos públicos
│   └── assets/
│       ├── icons/                   # Iconos PWA
│       └── images/                  # Imágenes
├── scripts/                         # Scripts de automatización
├── src/                             # Código fuente
│   ├── components/                  # Componentes reutilizables
│   │   ├── auth/                   # Autenticación
│   │   ├── inventory/              # Inventario
│   │   ├── menu/                   # Menú
│   │   ├── notifications/          # Notificaciones
│   │   ├── orders/                 # Pedidos
│   │   ├── payments/               # Pagos Bold
│   │   └── reports/                # Reportes
│   ├── contexts/                    # Contextos React
│   ├── hooks/                       # Custom hooks
│   │   └── usePayment.js           # Hook para pagos
│   ├── pages/                       # Páginas principales
│   │   ├── admin/                  # Panel administración
│   │   ├── auth/                   # Login
│   │   ├── cashier/                # Panel cajero
│   │   ├── client/                 # Menú clientes
│   │   ├── delivery/               # Panel domiciliario
│   │   └── waiter/                 # Panel camarero
│   ├── services/                    # Servicios externos
│   │   ├── firebase.js             # Inicialización Firebase
│   │   ├── boldPayment.js          # API Bold pagos
│   │   ├── whatsappNotification.js # WhatsApp Business API
│   │   └── pushNotification.js     # Firebase Cloud Messaging
│   ├── utils/                       # Funciones auxiliares
│   ├── App.js                       # Componente principal
│   └── App.css                      # Estilos globales
├── .env.local                       # Variables de entorno
├── .gitignore
├── package.json
├── tailwind.config.js
└── README.md
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Firebase
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=tu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id

# Bold Payments
REACT_APP_BOLD_API_KEY=tu_bold_api_key

# WhatsApp Business API
REACT_APP_WHATSAPP_TOKEN=tu_whatsapp_token
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id

# Push Notifications
REACT_APP_VAPID_KEY=tu_vapid_key
```

### 3. Iniciar servidor de desarrollo

```bash
npm start
```

## 📦 Dependencias Principales

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| react | ^18.2.0 | Framework UI |
| react-router-dom | ^6.20.0 | Enrutamiento |
| firebase | ^10.7.0 | Backend as a Service |
| react-icons | ^4.12.0 | Iconos |
| react-toastify | ^9.1.3 | Notificaciones |
| qrcode.react | ^3.1.0 | Generación QR |
| date-fns | ^2.30.0 | Manejo de fechas |
| tailwindcss | ^3.3.6 | Estilos |

## 🎨 Diseño

- **Colores principales:**
  - Dorado: `#D4A843` (botones, acentos)
  - Negro: `#0d0d0d` (fondo principal)
  - Rojo: `#C40F0F` (alertas, errores)

- **Fuentes:**
  - Títulos: Cormorant Garamond
  - Cuerpo: Montserrat

## 👥 Roles de Usuario

| Rol | Acceso | Funcionalidades |
|-----|--------|-----------------|
| **Cliente** | Público | Ver menú, escanear QR |
| **Camarero** | Autenticado | Tomar pedidos, gestionar mesas |
| **Cajero** | Autenticado | Cobrar, facturar, reportes |
| **Domiciliario** | Autenticado | Gestionar entregas |
| **Administrador** | Autenticado | Menú, inventario, empleados |

## 🔧 Integraciones

### Bold Payments
- Creación de links de pago
- Consulta de estados
- Soporte: Tarjetas, PSE, Nequi

### WhatsApp Business
- Confirmación de pedidos
- Actualizaciones de estado
- Notificaciones de entrega

### Firebase Cloud Messaging
- Notificaciones push
- Actualizaciones en tiempo real

## 📱 Funcionalidades

### Cliente
- Menú digital con precios
- Código QR por mesa
- Sin autenticación requerida

### Camarero
- Tomar pedidos por mesa
- Enviar a cocina
- Gestionar estado de pedidos

### Cajero
- Cobrar pedidos
- Generar facturas
- Ver reportes diarios

### Domiciliario
- Ver pedidos para entregar
- Actualizar estado de entrega
- Confirmar entrega

### Administrador
- Gestionar menú y precios
- Control de inventario
- Gestionar empleados
- Ver reportes completos

## 🗄️ Base de Datos (Firestore)

```
users/           - Usuarios del sistema
menu/            - Elementos del menú
tables/          - Estado de mesas
orders/          - Pedidos
inventory/       - Productos en inventario
dailyReports/    - Reportes diarios
```

## 🛠️ Scripts Disponibles

```bash
# Iniciar desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test

# Verificar código
npm run lint
```

## 📄 Documentación

- [Estructura de Base de Datos](docs/DATABASE_STRUCTURE.md)
- [Guía de Integración](docs/INTEGRATION_GUIDE.md)
- [Configuración de Bold](https://developers.bold.co/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 👨‍💻 Desarrollado por

**Distrito Wok Simón** - Comida Oriental Colombiana

## 📝 Licencia

© 2024 Distrito Wok Simón. Todos los derechos reservados.