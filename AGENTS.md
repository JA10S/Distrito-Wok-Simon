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
├── hooks/          # Custom hooks (usePayment)
├── services/       # APIs externas (Firebase, Bold, WhatsApp)
├── utils/          # Utilidades (helpers, constants, validations)
└── config/         # Configuración Firebase
```

## 🎨 Diseño
- **Colores:** Dorado (#D4A843), Negro (#0d0d0d), Rojo (#C40F0F)
- **Fuentes:** Cormorant Garamond (títulos), Montserrat (cuerpo)
- **Estilo:** Tailwind CSS

## 🔑 Credenciales
- **Firebase:** Configuradas en `src/config/firebase.js`
- **Bold:** Pendiente (ver `docs/INTEGRATION_GUIDE.md`)

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

> **SIEMPRE actualizar ambos menús al mismo tiempo:**
> 1. **Menú Web** → `src/pages/client/MenuPage.js`
> 2. **Menú PDF** → Ejecutar `.\scripts\generate-menu-pdf.ps1`

### Flujo de actualización del menú:
```
1. Editar MenuPage.js (precios, platos, descripciones)
2. Ejecutar: npm run build
3. Ejecutar: firebase deploy --only hosting
4. Ejecutar: .\scripts\generate-menu-pdf.ps1
5. Abrir HTML en navegador → Ctrl+P → Guardar como PDF
6. Guardar PDF en: archive/pdfs/
```

### Archivos del menú:
| Archivo | Tipo | Ubicación |
|---------|------|-----------|
| MenuPage.js | Código fuente | `src/pages/client/` |
| menu-distrito-wok-simon-actualizado.pdf | PDF | `archive/pdfs/` |

## 📌 Otras Notas
- Firebase ya está configurado y funcionando
- Hosting desplegado en `https://distrito-wok-simon.web.app`
- Skill `firebase-db-modeler` disponible para modelado de BD

## 🚀 Próximos Pasos
1. Habilitar Authentication en Firebase Console
2. Crear Firestore Database
3. Integrar pagos Bold
4. Configurar WhatsApp Business API