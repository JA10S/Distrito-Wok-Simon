# Estructura de Base de Datos - Firestore

## Colecciones Principales

### 1. users (Usuarios del sistema)
```javascript
{
  id: "user_id",
  email: "usuario@email.com",
  role: "admin|cashier|waiter|delivery",
  name: "Nombre del empleado",
  phone: "+573001234567",
  active: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. menu (Platos del menú)
```javascript
{
  id: "dish_id",
  name: "Arroz Costeño Wok",
  description: "Cerdo, pollo, chorizo y butifarra...",
  category: "arroces|corrientes|porciones|bebidas",
  prices: {
    small: 30000,  // Medio
    large: 40000   // Entero
  },
  ingredients: ["arroz", "cerdo", "pollo", "chorizo"],
  available: true,
  imageUrl: "url_de_imagen",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. orders (Pedidos)
```javascript
{
  id: "order_id",
  tableNumber: 1,  // 0 para domicilio
  status: "pending|preparing|ready|delivered|paid",
  items: [
    {
      dishId: "dish_id",
      name: "Arroz Costeño Wok",
      quantity: 2,
      size: "large",
      price: 40000,
      notes: "Sin cebolla"
    }
  ],
  subtotal: 80000,
  tax: 8000,
  total: 88000,
  paymentMethod: "cash|bold|nequi|card",
  paymentStatus: "pending|completed",
  waiterId: "user_id",
  cashierId: "user_id",
  deliveryId: "user_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. tables (Mesas)
```javascript
{
  id: "table_id",
  number: 1,
  capacity: 4,
  status: "available|occupied|reserved",
  currentOrderId: "order_id",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. inventory (Inventario)
```javascript
{
  id: "product_id",
  name: "Arroz",
  category: "granos|carnes|verduras|bebidas|limpieza",
  unit: "kg|lb|unidades|litros",
  currentStock: 50,
  minStock: 10,
  maxStock: 100,
  costPerUnit: 3000,
  supplierId: "supplier_id",
  lastRestocked: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 6. suppliers (Proveedores)
```javascript
{
  id: "supplier_id",
  name: "Distribuidora XYZ",
  contactName: "Juan Pérez",
  phone: "+573001234567",
  email: "contacto@xyz.com",
  address: "Calle 123, Barranquilla",
  products: ["product_id_1", "product_id_2"],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7. shifts (Turnos)
```javascript
{
  id: "shift_id",
  userId: "user_id",
  startDate: timestamp,
  endDate: timestamp,
  status: "active|completed",
  totalSales: 0,
  totalOrders: 0,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 8. reports (Reportes)
```javascript
{
  id: "report_id",
  date: "2024-01-15",
  totalSales: 500000,
  totalOrders: 25,
  paymentMethods: {
    cash: 200000,
    bold: 250000,
    nequi: 50000
  },
  topDishes: [
    { dishId: "dish_id", name: "Arroz Costeño", quantity: 15 }
  ],
  inventoryUsed: [
    { productId: "product_id", name: "Arroz", quantity: 10 }
  ],
  createdAt: timestamp
}
```

## Relaciones entre Colecciones

```
users ──────────┐
                │
orders ─────────┼──────── menu
    │           │
    │           └──────── tables
    │
    └──────────────────── inventory
                            │
                            └──────── suppliers
```

## Índices Recomendados

```javascript
// Índice para pedidos por mesa
db.collection('orders').where('tableNumber', '==', 1).where('status', '!=', 'paid')

// Índice para pedidos por estado
db.collection('orders').where('status', '==', 'pending')

// Índice para inventario bajo
db.collection('inventory').where('currentStock', '<=', 'minStock')

// Índice para reportes por fecha
db.collection('reports').where('date', '>=', '2024-01-01')
```