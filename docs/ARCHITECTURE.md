# Arquitectura Backend - Delivery API

## Estructura del Proyecto

```
backend/
├── models/
│   ├── User.js
│   ├── Vehicle.js
│   ├── Ride.js
│   ├── Plan.js
│   ├── Subscription.js
│   └── Payment.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── rideController.js
│   └── subscriptionController.js
├── services/
│   ├── authService.js
│   ├── priceService.js
│   └── driverService.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── rideRoutes.js
│   └── subscriptionRoutes.js
├── middleware/
│   └── authMiddleware.js
├── server.js
├── package.json
└── .env.example
```

## Modelos de Datos

### User
- name: string
- cedula: string (único)
- email: string (único)
- password: string (hasheada)
- phone: string
- role: enum['admin', 'motorizado', 'cliente']
- status: enum['active', 'inactive', 'suspended']
- isOnline: boolean
- currentLocation: { lat, lng }

### Vehicle
- type: enum['moto', 'auto', 'bicicleta']
- plate: string (único)
- owner: reference to User
- status: enum['active', 'inactive']

### Ride
- client: reference to User
- driver: reference to User
- description: string
- pickup: { lat, lng, address }
- dropoff: { lat, lng, address }
- price: number (USD)
- distance: number (km)
- status: enum['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
- driverLocation: { lat, lng }

### Plan
- name: string
- price: number
- maxVehicles: number
- commission: number (porcentaje)
- description: string
- status: enum['active', 'inactive']

### Subscription
- user: reference to User
- plan: reference to Plan
- status: enum['active', 'inactive', 'suspended']
- startDate: date
- endDate: date
- autoRenew: boolean

### Payment
- user: reference to User
- subscription: reference to Subscription
- image: string (URL)
- amount: number
- status: enum['pending', 'approved', 'rejected']
- rejectionReason: string
- verifiedBy: reference to User (admin)
- verifiedAt: date

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/vehicles` - Agregar vehículo
- `GET /api/users/vehicles` - Obtener vehículos
- `PUT /api/users/status` - Actualizar estado (online/offline)
- `PUT /api/users/location` - Actualizar ubicación

### Carreras
- `POST /api/rides` - Crear carrera
- `GET /api/rides/:id` - Obtener detalles de carrera
- `GET /api/my-rides` - Obtener mis carreras
- `PUT /api/rides/:id/accept` - Aceptar carrera (motorizado)
- `PUT /api/rides/:id/cancel` - Cancelar carrera
- `PUT /api/rides/:id/complete` - Completar carrera

### Suscripciones
- `GET /api/subscriptions/plans` - Obtener planes disponibles
- `POST /api/subscriptions/plans` - Crear plan (admin)
- `POST /api/subscriptions/subscribe` - Suscribirse a plan
- `GET /api/subscriptions/my-subscription` - Obtener mi suscripción
- `POST /api/subscriptions/payments/upload` - Subir comprobante de pago
- `PUT /api/subscriptions/payments/:paymentId/verify` - Verificar pago (admin)

## Algoritmos Principales

### Cálculo de Distancia (Haversine)
```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
```

### Cálculo de Precio
```
precio = max(1.50, distancia_km * 0.50)
```

### Búsqueda de Motorizados Disponibles
1. Filtrar motorizados con suscripción activa
2. Filtrar motorizados en línea
3. Calcular distancia desde ubicación del cliente
4. Ordenar por proximidad (más cercano primero)
5. Retornar lista ordenada

## WebSocket Events

### Cliente → Servidor
- `driver_online` - Motorizado conecta
- `driver_offline` - Motorizado desconecta
- `driver_location_update` - Actualizar ubicación del motorizado
- `ride_accepted` - Motorizado acepta carrera
- `driver_arriving` - Motorizado está llegando

### Servidor → Cliente
- `driver_available` - Motorizado disponible
- `driver_unavailable` - Motorizado no disponible
- `driver_location` - Ubicación actualizada del motorizado
- `ride_accepted` - Carrera aceptada
- `driver_arriving` - Motorizado llegando

## Autenticación

Se utiliza JWT (JSON Web Tokens) para la autenticación:
- Token válido por 24 horas
- Se envía en el header: `Authorization: Bearer <token>`
- Payload: `{ userId, role }`

## Middleware

### authMiddleware
Verifica que el usuario esté autenticado mediante JWT.

### adminMiddleware
Verifica que el usuario sea administrador.

### driverMiddleware
Verifica que el usuario sea motorizado.

## Consideraciones de Escalabilidad

1. **Base de datos**: Usar índices en campos frecuentemente consultados (email, cedula, ubicación)
2. **Cache**: Implementar Redis para caché de planes y suscripciones
3. **Microservicios**: Separar en el futuro: auth, rides, payments, notifications
4. **Mensajería**: Implementar RabbitMQ para procesos asincronos
5. **CDN**: Cloudinary para almacenamiento de imágenes
6. **Load Balancer**: Nginx para distribuir carga
