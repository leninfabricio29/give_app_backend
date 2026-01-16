# Guía Rápida de Prueba - Backend Delivery API

## 1. Preparación Inicial

### Instalar dependencias
```bash
cd backend
npm install
```

### Crear archivo .env
```bash
cp .env.example .env
```

### Asegúrate que MongoDB esté ejecutándose
```bash
# En Windows (si MongoDB está instalado)
mongod

# O usa MongoDB Atlas (nube)
# Actualiza MONGODB_URI en .env con tu conexión
```

## 2. Iniciar el servidor

```bash
npm run dev
```

Deberías ver:
```
MongoDB conectado
Servidor corriendo en el puerto 5000
Ambiente: development
```

## 3. Pruebas con Postman/cURL

### A) Registrar un Cliente

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Juan García",
  "cedula": "0102030405",
  "email": "juan@mail.com",
  "password": "password123",
  "phone": "0999999999",
  "role": "cliente"
}
```

**Respuesta esperada** (Status 201):
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan García",
    "email": "juan@mail.com",
    "role": "cliente"
  }
}
```

### B) Registrar un Motorizado

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Carlos López",
  "cedula": "0202020202",
  "email": "carlos@mail.com",
  "password": "password123",
  "phone": "0988888888",
  "role": "motorizado"
}
```

### C) Login

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "identifier": "juan@mail.com",
  "password": "password123"
}
```

**Respuesta esperada** (Status 200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Juan García",
    "email": "juan@mail.com",
    "role": "cliente"
  }
}
```

**Guarda el token para las siguientes pruebas**

### D) Obtener Perfil (Requiere autenticación)

```bash
GET http://localhost:5000/api/users/profile
Authorization: Bearer {tu_token_aquí}
```

### E) Crear un Plan (Como Admin)

Primero necesitas registrarte como admin y obtener su token:

```bash
POST http://localhost:5000/api/subscriptions/plans
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Básico",
  "price": 10,
  "maxVehicles": 1,
  "commission": 10,
  "description": "Plan básico con 1 vehículo"
}
```

### F) Obtener Planes Disponibles (Sin autenticación)

```bash
GET http://localhost:5000/api/subscriptions/plans
```

### G) Crear una Carrera

```bash
POST http://localhost:5000/api/rides
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "description": "Envío de documentos",
  "pickup": {
    "lat": -3.9916,
    "lng": -79.2012,
    "address": "Calle Principal 123"
  },
  "dropoff": {
    "lat": -3.9950,
    "lng": -79.2050,
    "address": "Calle Secundaria 456"
  }
}
```

**Respuesta esperada**:
```json
{
  "message": "Ride created successfully",
  "ride": {
    "_id": "607f1f77bcf86cd799439012",
    "price": 1.50,
    "distance": 3.2,
    "status": "pending"
  },
  "availableDrivers": 0
}
```

### H) Agregar Vehículo (Motorizado)

```bash
POST http://localhost:5000/api/users/vehicles
Authorization: Bearer {motorizado_token}
Content-Type: application/json

{
  "type": "moto",
  "plate": "ABC-123"
}
```

### I) Actualizar Estado a Online (Motorizado)

```bash
PUT http://localhost:5000/api/users/status
Authorization: Bearer {motorizado_token}
Content-Type: application/json

{
  "isOnline": true
}
```

### J) Aceptar una Carrera (Motorizado)

```bash
PUT http://localhost:5000/api/rides/{ride_id}/accept
Authorization: Bearer {motorizado_token}
```

## 4. Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "message": "Descripción de lo que pasó",
  "data": { /* datos específicos */ }
}
```

### Respuesta con Error de Validación
```json
{
  "errors": [
    "Name is required",
    "Valid email is required"
  ]
}
```

### Respuesta con Error del Servidor
```json
{
  "error": "Descripción del error"
}
```

## 5. Códigos de Estado HTTP

- `200` - Éxito (GET, PUT, DELETE)
- `201` - Creado exitosamente (POST)
- `400` - Solicitud inválida (errores de validación)
- `401` - No autenticado (falta o token inválido)
- `403` - No autorizado (insuficientes permisos)
- `404` - No encontrado (recurso no existe)
- `500` - Error del servidor

## 6. Pruebas con WebSockets

### Cliente Node.js para testing (opcional)

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000');

// Motorizado conecta
socket.emit('driver_online', { driverId: '507f1f77bcf86cd799439011' });

// Escuchar cuando hay un cliente nuevo
socket.on('driver_available', (data) => {
    console.log('Motorizado disponible:', data);
});

// Actualizar ubicación
socket.emit('driver_location_update', {
    driverId: '507f1f77bcf86cd799439011',
    lat: -3.9916,
    lng: -79.2012
});

// Notificar aceptación de carrera
socket.emit('ride_accepted', {
    clientId: '507f1f77bcf86cd799439010',
    rideId: '607f1f77bcf86cd799439012'
});
```

## 7. Troubleshooting

### MongoDB no conecta
```
Error: connect ECONNREFUSED
```
**Solución**: 
- Instala MongoDB localmente o
- Configura conexión a MongoDB Atlas en .env

### Error de token inválido
```json
{ "error": "Invalid token" }
```
**Solución**: 
- Verifica que el token sea válido
- Regenera haciendo login nuevamente

### Puerto 5000 en uso
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solución**:
```bash
# Cambia el puerto en .env
PORT=3001
```

### CORS error
**Solución**: CORS ya está configurado para aceptar todas las origins en desarrollo

## 8. Checklist de Validación

- [ ] MongoDB conecta correctamente
- [ ] Servidor inicia sin errores
- [ ] Registro de usuario funciona
- [ ] Login genera token JWT
- [ ] Endpoints requieren autenticación
- [ ] Validaciones de entrada funcionan
- [ ] Cálculo de precios es correcto
- [ ] Búsqueda de motorizados filtra correctamente
- [ ] WebSocket conecta y emite eventos

## 9. Variables de Entorno para Testing

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delivery
JWT_SECRET=test-secret-key-change-in-production
NODE_ENV=development
```

## 10. Comandos Útiles

```bash
# Iniciar en modo desarrollo (con auto-reload)
npm run dev

# Iniciar en modo producción
npm start

# Ver todos los logs
npm run dev 2>&1 | tee server.log
```

---

¡Listo para empezar a probar la API!

Cualquier duda, revisa:
- README.md - Instalación completa
- ARCHITECTURE.md - Detalles de arquitectura
- API_EXAMPLES.md - Ejemplos de todos los endpoints
