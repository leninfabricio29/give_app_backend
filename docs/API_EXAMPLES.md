# Ejemplos de Uso de APIs

## 1. Autenticación

### Registrar Cliente
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Juan García",
  "cedula": "0102030405",
  "email": "juan@mail.com",
  "password": "password123",
  "phone": "0999999999",
  "role": "cliente"
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Juan García",
    "email": "juan@mail.com",
    "role": "cliente"
  }
}
```

### Registrar Motorizado
```bash
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Carlos López",
  "cedula": "0202020202",
  "email": "carlos@mail.com",
  "password": "password123",
  "phone": "0988888888",
  "role": "motorizado"
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "fullName": "Carlos López",
    "email": "carlos@mail.com",
    "role": "motorizado"
  }
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@mail.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "juan@mail.com",
    "fullName": "Juan García",
    "role": "cliente"
  }
}
```

## 2. Gestión de Usuarios

### Obtener Perfil
```bash
GET /api/users/profile
Authorization: Bearer {token}
```

### Actualizar Perfil
```bash
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "0999999999"
}
```

### Agregar Vehículo (Motorizado)
```bash
POST /api/users/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "moto",
  "plate": "ABC-123"
}
```

### Obtener Mis Vehículos
```bash
GET /api/users/vehicles
Authorization: Bearer {token}
```

### Actualizar Estado (Online/Offline)
```bash
PUT /api/users/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "isOnline": true
}
```

### Actualizar Ubicación
```bash
PUT /api/users/location
Authorization: Bearer {token}
Content-Type: application/json

{
  "latitude": -3.9916,
  "longitude": -79.2012,
  "address": "Calle Principal 123"
}
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "Juan García",
  "email": "juan@mail.com",
  "location": {
    "latitude": -3.9916,
    "longitude": -79.2012,
    "address": "Calle Principal 123"
  }
}
```

## 3. Gestión de Carreras

### Crear Carrera
```bash
POST /api/rides
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Envío de documentos",
  "pickupLocation": {
    "latitude": -3.9916,
    "longitude": -79.2012,
    "address": "Calle Principal 123"
  },
  "dropoffLocation": {
    "latitude": -3.9950,
    "longitude": -79.2050,
    "address": "Calle Secundaria 456"
  }
}
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "client": "507f1f77bcf86cd799439011",
  "description": "Envío de documentos",
  "pickupLocation": {
    "latitude": -3.9916,
    "longitude": -79.2012,
    "address": "Calle Principal 123"
  },
  "dropoffLocation": {
    "latitude": -3.9950,
    "longitude": -79.2050,
    "address": "Calle Secundaria 456"
  },
  "distance": 0.566,
  "price": 1.50,
  "status": "pending",
  "createdAt": "2026-01-09T10:30:00Z"
}
```

### Obtener Detalles de Carrera
```bash
GET /api/rides/507f1f77bcf86cd799439012
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "client": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "Juan García",
    "phone": "0999999999"
  },
  "driver": {
    "_id": "507f1f77bcf86cd799439013",
    "fullName": "Carlos López",
    "phone": "0988888888"
  },
  "pickupLocation": {
    "latitude": -3.9916,
    "longitude": -79.2012,
    "address": "Calle Principal 123"
  },
  "dropoffLocation": {
    "latitude": -3.995,
    "longitude": -79.205,
    "address": "Calle Secundaria 456"
  },
  "distance": 0.566,
  "price": 1.50,
  "status": "pending",
  "createdAt": "2026-01-09T10:30:00Z",
  "updatedAt": "2026-01-09T10:30:00Z"
}
```

### Obtener Mis Carreras
```bash
GET /api/my-rides
Authorization: Bearer {token}
```

**Respuesta:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "client": "507f1f77bcf86cd799439011",
    "driver": "507f1f77bcf86cd799439013",
    "pickupLocation": {
      "latitude": -3.9916,
      "longitude": -79.2012,
      "address": "Calle Principal 123"
    },
    "dropoffLocation": {
      "latitude": -3.9950,
      "longitude": -79.2050,
      "address": "Calle Secundaria 456"
    },
    "distance": 0.566,
    "price": 1.50,
    "status": "completed",
    "rating": 5,
    "createdAt": "2026-01-09T10:30:00Z"
  }
]
```

### Aceptar Carrera (Motorizado)
```bash
PUT /api/rides/507f1f77bcf86cd799439012/accept
Authorization: Bearer {token}
```

### Cancelar Carrera
```bash
PUT /api/rides/507f1f77bcf86cd799439012/cancel
Authorization: Bearer {token}
```

### Completar Carrera
```bash
PUT /api/rides/507f1f77bcf86cd799439012/complete
Authorization: Bearer {token}
```

## 4. Planes y Suscripciones

### Obtener Planes Disponibles
```bash
GET /api/subscriptions/plans
```

**Respuesta:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439001",
    "name": "Básico",
    "price": 10,
    "maxVehicles": 1,
    "commission": 10,
    "description": "Plan básico con 1 vehículo"
  },
  {
    "_id": "507f1f77bcf86cd799439002",
    "name": "Premium",
    "price": 25,
    "maxVehicles": 3,
    "commission": 8,
    "description": "Plan premium con 3 vehículos"
  }
]
```

### Crear Plan (Admin)
```bash
POST /api/subscriptions/plans
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "name": "Básico",
  "price": 10,
  "maxVehicles": 1,
  "commission": 10,
  "description": "Plan básico con 1 vehículo"
}
```

### Suscribirse a Plan
```bash
POST /api/subscriptions/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "507f1f77bcf86cd799439001"
}
```

### Obtener Mi Suscripción
```bash
GET /api/subscriptions/my-subscription
Authorization: Bearer {token}
```

### Subir Comprobante de Pago
```bash
POST /api/subscriptions/payments/upload
Authorization: Bearer {token}
Content-Type: application/json

{
  "image": "https://cloudinary.com/image.jpg",
  "amount": 10
}
```

### Verificar Pago (Admin)
```bash
PUT /api/subscriptions/payments/507f1f77bcf86cd799439003/verify
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "approved": true,
  "rejectionReason": null
}
```

## Códigos de Error

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Solicitud inválida
- `401` - No autenticado
- `403` - No autorizado
- `404` - No encontrado
- `500` - Error del servidor
