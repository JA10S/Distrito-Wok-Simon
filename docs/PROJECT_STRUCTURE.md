# 🏗️ Estructura del Proyecto - Guía para IA

## Estructura Optimizada para Desarrollo con IA

```
restaurante/
│
├── 📁 src/                          # CÓDIGO FUENTE (React)
│   ├── 📁 components/               # Componentes reutilizables
│   │   ├── 📁 auth/                 # Autenticación
│   │   ├── 📁 common/               # Componentes genéricos (Button, Card, Modal)
│   │   ├── 📁 layout/               # Layouts (Header, Footer, Sidebar)
│   │   ├── 📁 menu/                 # Menú
│   │   ├── 📁 orders/               # Pedidos
│   │   ├── 📁 payments/             # Pagos
│   │   └── 📁 inventory/            # Inventario
│   │
│   ├── 📁 pages/                    # Páginas/Rutas
│   │   ├── 📁 admin/                # Panel administración
│   │   ├── 📁 auth/                 # Login
│   │   ├── 📁 cashier/              # Panel cajero
│   │   ├── 📁 client/               # Menú clientes
│   │   ├── 📁 delivery/             # Panel domiciliario
│   │   └── 📁 waiter/               # Panel camarero
│   │
│   ├── 📁 contexts/                 # React Context (Estado global)
│   │   └── AuthContext.js
│   │
│   ├── 📁 hooks/                    # Custom Hooks
│   │   ├── usePayment.js
│   │   ├── useMenu.js
│   │   └── useOrders.js
│   │
│   ├── 📁 services/                 # Servicios externos (APIs)
│   │   ├── firebase.js              # Inicialización Firebase
│   │   ├── boldPayment.js           # API Bold
│   │   ├── whatsappNotification.js  # WhatsApp API
│   │   └── pushNotification.js      # FCM
│   │
│   ├── 📁 utils/                    # Utilidades
│   │   ├── 📁 helpers/              # Funciones auxiliares
│   │   │   ├── formatCurrency.js
│   │   │   └── formatDate.js
│   │   ├── 📁 constants/            # Constantes
│   │   │   └── menuData.js
│   │   └── 📁 validations/          # Validaciones
│   │       └── orderValidation.js
│   │
│   ├── 📁 config/                   # Configuraciones
│   │   └── firebase.js
│   │
│   ├── App.js                       # Componente principal
│   ├── App.css                      # Estilos globales
│   └── index.js                     # Entry point
│
├── 📁 public/                       # ARCHIVOS PÚBLICOS
│   ├── index.html
│   ├── manifest.json
│   └── 📁 assets/
│       ├── 📁 icons/
│       └── 📁 images/
│
├── 📁 docs/                         # DOCUMENTACIÓN
│   ├── ARCHITECTURE.md              # Arquitectura del sistema
│   ├── DATABASE_STRUCTURE.md        # Estructura Firestore
│   ├── INTEGRATION_GUIDE.md         # Guía de integración
│   └── MENU_RESTAURANTE.md          # Documentación del menú
│
├── 📁 designs/                      # DISEÑOS HTML
│   ├── menu-web-version.html        # Menú web completo
│   └── qr_menu.html                 # QR del menú
│
├── 📁 scripts/                      # SCRIPTS
│   ├── deploy.sh                    # Despliegue
│   └── generate-pdf.ps1             # Generar PDF
│
├── 📁 tests/                        # TESTS
│   ├── App.test.js
│   └── setupTests.js
│
├── 📁 archive/                      # ARCHIVOS ANTIGUOS
│   ├── html-versions/
│   ├── images/
│   └── pdfs/
│
├── 📄 .gitignore                    # Archivos ignorados
├── 📄 firebase.json                 # Config Firebase Hosting
├── 📄 .firebaserc                   # Proyecto Firebase
├── 📄 package.json                  # Dependencias
├── 📄 tailwind.config.js            # Config Tailwind
├── 📄 README.md                     # Documentation
└── 📄 AGENTS.md                     # Instrucciones para IA
```

---

## 🎯 Convenciones para IA

### Nomenclatura de archivos:

| Tipo | Ejemplo | Descripción |
|------|---------|-------------|
| Componente | `Button.js` | PascalCase |
| Página | `MenuPage.js` | PascalCase + "Page" |
| Hook | `usePayment.js` | camelCase + "use" |
| Servicio | `boldPayment.js` | camelCase |
| Util | `formatCurrency.js` | camelCase |
| Constante | `menuData.js` | camelCase |
| Test | `App.test.js` | Nombre + ".test.js" |

### Imports (orden recomendado):

```javascript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Librerías externas
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// 3. Componentes
import Button from '../components/common/Button';
import Header from '../components/layout/Header';

// 4. Contexts
import { useAuth } from '../contexts/AuthContext';

// 5. Hooks
import usePayment from '../hooks/usePayment';

// 6. Servicios
import { createPaymentLink } from '../services/boldPayment';

// 7. Utils
import { formatCurrency } from '../utils/helpers/formatCurrency';

// 8. Constantes
import { MENU_CATEGORIES } from '../utils/constants/menuData';
```

---

## 📋 Archivos Clave para IA

| Archivo | Propósito |
|---------|-----------|
| `AGENTS.md` | Instrucciones principales para IA |
| `docs/ARCHITECTURE.md` | Arquitectura del sistema |
| `docs/DATABASE_STRUCTURE.md` | Estructura de datos |
| `src/config/firebase.js` | Configuración Firebase |
| `package.json` | Dependencias |

---

## 🔄 Comandos Rápidos

```bash
# Desarrollo
npm start

# Build
npm run build

# Deploy
firebase deploy --only hosting

# Tests
npm test
```

---

**Última actualización:** Agosto 2026