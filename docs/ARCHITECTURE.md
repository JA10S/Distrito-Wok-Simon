# Arquitectura del Sistema - Distrito Wok Simón

## 🏗️ Visión General

Sistema de gestión integral para restaurante utilizando arquitectura mixta:
- **Firebase**: Tiempo real, autenticación, notificaciones
- **PostgreSQL**: Datos relacionales, reportes, analytics

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │    Cliente    │  │   Camarero   │  │    Cajero    │  │    Admin   │ │
│  │  (Menú QR)   │  │  (Pedidos)   │  │   (Cobros)   │  │ (Reportes) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│         FIREBASE            │   │         POSTGRESQL          │
│    (Backend as a Service)   │   │    (Base de Datos Relacional)│
├─────────────────────────────┤   ├─────────────────────────────┤
│                             │   │                             │
│  🔐 Authentication          │   │  📊 Reportes de Ventas      │
│     • Login empleados       │   │     • Diario/Semanal/Mensual│
│     • Roles por usuario     │   │     • Por categoría         │
│     • Sesiones              │   │     • Por empleado          │
│                             │   │                             │
│  📦 Firestore (NoSQL)       │   │  📈 Analytics               │
│     • Menú del restaurante  │   │     • Tendencias de ventas  │
│     • Pedidos activos       │   │     • Productos más vendidos│
│     • Estado de mesas       │   │     • Horarios pico         │
│     • Usuarios              │   │     • Rotación de inventario│
│                             │   │                             │
│  🔔 Cloud Messaging (FCM)   │   │  💰 Facturación             │
│     • Notificaciones push   │   │     • Numeración DIAN       │
│     • Alertas de pedidos    │   │     • Notas crédito         │
│                             │   │     • Retenciones           │
│  🌐 Hosting                 │   │                             │
│     • Sitio web estático    │   │  📦 Inventario Detallado    │
│     • Menú público          │   │     • Movimientos           │
│                             │   │     • Proveedores           │
│  ⚡ Cloud Functions         │   │     • Costos                │
│     • Sincronizar datos     │   │                             │
│     • Webhooks              │   │  📋 Historial Completo      │
│     • Validaciones          │   │     • Pedidos archivados    │
│                             │   │     • Auditoría             │
└─────────────────────────────┘   └─────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
                    ┌─────────────────────────────┐
                    │    CLOUD FUNCTIONS (Glue)   │
                    ├─────────────────────────────┤
                    │  • Sync Firestore ↔ PostgreSQL│
                    │  • Generar reportes          │
                    │  • Enviar notificaciones     │
                    │  • Procesar pagos            │
                    └─────────────────────────────┘
```

---

## 🎯 Distribución de Responsabilidades

### Firebase (Tiempo Real + Auth)

| Componente | Responsabilidad | Datos |
|------------|-----------------|-------|
| **Authentication** | Login/Logout de usuarios | Credenciales, sesiones |
| **Firestore** | Datos en tiempo real | Pedidos activos, mesas, menú |
| **FCM** | Notificaciones push | Alertas pedidos, entregas |
| **Hosting** | Sitio web estático | Menú público, landing |
| **Cloud Functions** | Backend serverless | Webhooks, validaciones |

### PostgreSQL (Datos Relacionales + Reportes)

| Componente | Responsabilidad | Datos |
|------------|-----------------|-------|
| **Reportes** | Analytics y estadísticas | Ventas históricas, tendencias |
| **Inventario** | Control de stock | Productos, movimientos, costos |
| **Facturación** | Documentos legales | Facturas, notas crédito, DIAN |
| **Auditoría** | Trazabilidad | Logs de cambios, historial |
| **Analytics** | Business intelligence | Dashboard, KPIs |

---

## 🔄 Flujo de Sincronización

### Pedido Normal (Solo Firebase)

```
Cliente → Menú → Agrega items → Confirma pedido
                                    ↓
                              Firestore (pedidos)
                                    ↓
                              Camarero recibe notificación
```

### Pedido con Reporte (Firebase + PostgreSQL)

```
Pedido completado en Firestore
        ↓
Cloud Function se activa
        ↓
┌───────────────────────────────────────┐
│  1. Actualizar PostgreSQL             │
│     • Insertar en tabla ventas        │
│     • Actualizar inventario           │
│     • Generar registro de auditoría   │
│                                       │
│  2. Mantener Firebase                 │
│     • Pedido permanece en Firestore   │
│     • Visible para camarero/cajero    │
└───────────────────────────────────────┘
```

---

## 📁 Estructura de Datos

### Firestore (NoSQL)

```
users/
├── {userId}
│   ├── name: string
│   ├── email: string
│   ├── role: "admin" | "waiter" | "cashier" | "delivery"
│   └── phone: string

menu/
├── {itemId}
│   ├── name: string
│   ├── category: string
│   ├── price: number
│   ├── available: boolean
│   └── image: string

orders/
├── {orderId}
│   ├── tableId: reference
│   ├── items: array
│   ├── status: "pending" | "preparing" | "ready" | "delivered" | "paid"
│   ├── total: number
│   └── createdAt: timestamp

tables/
├── {tableId}
│   ├── number: number
│   ├── status: "available" | "occupied" | "reserved"
│   └── currentOrder: reference
```

### PostgreSQL (Relacional)

```sql
-- Tabla de ventas históricas
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE,
    table_number INTEGER,
    total DECIMAL(10,2),
    tax DECIMAL(10,2),
    payment_method VARCHAR(20),
    waiter_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos vendidos
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    menu_item_id VARCHAR(50),
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    subtotal DECIMAL(10,2)
);

-- Tabla de inventario
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    min_stock DECIMAL(10,2),
    current_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Tabla de movimientos de inventario
CREATE TABLE inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id),
    movement_type VARCHAR(20), -- 'purchase', 'sale', 'adjustment'
    quantity DECIMAL(10,2),
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ☁️ Cloud Functions (Código Ejemplo)

### Sincronizar Pedido Completado

```javascript
const functions = require('firebase-functions');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Cuando un pedido se marca como "paid" en Firestore
exports.syncCompletedOrder = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Solo sincronizar cuando cambia a "paid"
    if (oldData.status !== 'paid' && newData.status === 'paid') {
      const orderId = context.params.orderId;
      
      // Insertar en PostgreSQL
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insertar venta
        const saleResult = await client.query(
          `INSERT INTO sales (order_id, table_number, total, tax, payment_method, waiter_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [orderId, newData.tableNumber, newData.total, newData.tax, newData.paymentMethod, newData.waiterId]
        );
        
        const saleId = saleResult.rows[0].id;
        
        // Insertar items
        for (const item of newData.items) {
          await client.query(
            `INSERT INTO sale_items (sale_id, menu_item_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [saleId, item.menuItemId, item.quantity, item.price, item.quantity * item.price]
          );
        }
        
        await client.query('COMMIT');
        console.log(`Pedido ${orderId} sincronizado con PostgreSQL`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error sincronizando:', error);
      } finally {
        client.release();
      }
    }
  });
```

---

## 🚀 Plan de Implementación

### Fase 1: MVP (Firebase Only) ✅
- [x] Autenticación Firebase
- [x] Menú en Firestore
- [x] Pedidos en tiempo real
- [x] Estado de mesas
- [x] Notificaciones FCM

### Fase 2: PostgreSQL (Reportes)
- [ ] Configurar Supabase/Neon
- [ ] Crear esquema relacional
- [ ] Cloud Function de sincronización
- [ ] Dashboard de reportes

### Fase 3: Arquitectura Completa
- [ ] Analytics avanzado
- [ ] Facturación DIAN
- [ ] Control de inventario completo
- [ ] Auditoría y trazabilidad

---

## 💰 Costos Estimados

### Firebase (Gratis para empezar)
| Servicio | Límite Gratis | Costo después |
|----------|---------------|---------------|
| Authentication | 10K usuarios/mes | $0.01/usuario |
| Firestore | 50K lecturas/día | $0.06/100K |
| Hosting | 10 GB | $0.02/GB |
| FCM | Ilimitado | Gratis |

### PostgreSQL (Gratis con Supabase)
| Servicio | Límite Gratis | Costo después |
|----------|---------------|---------------|
| Supabase Free | 500 MB | $25/mes |
| Neon Free | 0.5 GB | $19/mes |

---

## 📚 Referencias

- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)

---

**Última actualización:** Agosto 2026
**Estado:** Fase 1 completada