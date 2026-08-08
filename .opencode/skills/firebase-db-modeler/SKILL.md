---
name: firebase-db-modeler
description: Use when designing, modeling, or managing Firebase/Firestore databases. Trigger on keywords like firestore, firebase, collection, document, security rules, database schema, data model. Provides schema visualization, security rules generation, CRUD code templates, and database validation.
---

# Firebase/Firestore Database Modeler

Specialized skill for designing and managing Firebase/Firestore databases.

## Capabilities

### 1. Schema Design & Visualization

Generate visual representations of Firestore collections and documents:

```
Collection: users
├── {userId}
│   ├── name: string
│   ├── email: string
│   ├── role: "admin" | "waiter" | "cashier" | "delivery"
│   ├── phone: string
│   └── createdAt: timestamp

Collection: orders
├── {orderId}
│   ├── tableId: reference → tables/{tableId}
│   ├── items: array
│   │   ├── {itemId}
│   │   │   ├── menuItemId: reference → menu/{menuItemId}
│   │   │   ├── quantity: number
│   │   │   └── price: number
│   ├── status: "pending" | "preparing" | "ready" | "delivered" | "paid"
│   ├── total: number
│   ├── paymentMethod: string
│   └── createdAt: timestamp
```

### 2. Security Rules Generator

Generate Firestore security rules based on the schema:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 3. CRUD Code Templates

Generate React/Firebase code for operations:

```javascript
// Create
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: new Date(),
    status: 'pending'
  });
  return docRef.id;
};

// Read
import { doc, getDoc } from 'firebase/firestore';

const getOrder = async (orderId) => {
  const docSnap = await getDoc(doc(db, 'orders', orderId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Update
import { doc, updateDoc } from 'firebase/firestore';

const updateOrderStatus = async (orderId, newStatus) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: newStatus,
    updatedAt: new Date()
  });
};

// Delete
import { doc, deleteDoc } from 'firebase/firestore';

const deleteOrder = async (orderId) => {
  await deleteDoc(doc(db, 'orders', orderId));
};
```

### 4. Schema Validation

Validate database structure for:
- Missing indexes for common queries
- Inconsistent data types
- Missing required fields
- Orphaned references
- Inefficient data patterns

## Usage Examples

### Example 1: Design new collection

User: "Necesito crear una colección de inventario para el restaurante"

Response:
```
Collection: inventory
├── {itemId}
│   ├── name: string (required)
│   ├── category: string (required)
│   ├── quantity: number (required)
│   ├── unit: string (required)
│   ├── minStock: number (required)
│   ├── maxStock: number
│   ├── currentPrice: number (required)
│   ├── supplier: string
│   ├── lastRestocked: timestamp
│   └── createdAt: timestamp

Indexes:
- category ASC
- quantity ASC (for low stock alerts)
- lastRestocked DESC
```

### Example 2: Generate security rules

User: "Genera las reglas de seguridad para el inventario"

Response:
```javascript
match /inventory/{itemId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    getRole(request.auth.uid) == 'admin';
  allow update: if request.auth != null && 
    getRole(request.auth.uid) == 'admin';
  allow delete: if request.auth != null && 
    getRole(request.auth.uid) == 'admin';
}
```

### Example 3: Validate existing schema

User: "Valida mi esquema actual de Firestore"

Actions:
1. Read existing collections from documentation
2. Check for missing indexes
3. Identify inconsistent data types
4. Suggest optimizations
5. Generate improved schema

## Commands

| Command | Description |
|---------|-------------|
| `schema <collection>` | Design new collection schema |
| `rules <collection>` | Generate security rules |
| `crud <collection>` | Generate CRUD code |
| `validate` | Validate current schema |
| `visualize` | Show visual schema diagram |
| `optimize` | Suggest schema optimizations |

## Integration with Project

When working on the restaurant project, this skill:

1. Reads existing schema from `docs/DATABASE_STRUCTURE.md`
2. Validates against current implementation
3. Generates code that matches project conventions
4. Updates documentation automatically

## Best Practices

### Firestore Design Principles

1. **Denormalize when necessary** - Duplicate data for faster reads
2. **Use subcollections for related data** - orders/{orderId}/items/{itemId}
3. **Keep documents small** - Under 1MB, ideally under 100KB
4. **Use compound indexes** - For multi-field queries
5. **Implement security rules first** - Before writing client code

### Data Types

| JavaScript | Firestore |
|------------|-----------|
| string | string |
| number | number |
| boolean | boolean |
| object | map |
| array | array |
| Date | timestamp |
| null | null |
| Reference | reference |

### Common Patterns

```
// Pattern 1: Reference (for relationships)
order.tableId → tables/{tableId}

// Pattern 2: Subcollection (for child data)
orders/{orderId}/items/{itemId}

// Pattern 3: Root collection (for independent data)
users/{userId}
menu/{menuItemId}
inventory/{itemId}
```

## References

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security)
- [Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)