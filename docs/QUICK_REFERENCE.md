# 📋 Quick Reference - Referencia Rápida

## 🚀 Comandos Esenciales

```bash
# Instalar
npm install

# Desarrollo
npm run dev

# Producción
npm start

# Ver logs
pm2 logs server.js

# Recargar cambios
npm run dev
```

---

## 🔌 Endpoints Principales

### Login/Register
```bash
POST /api/auth/register          # Registrar
POST /api/auth/login             # Login → JWT
```

### Usuario
```bash
GET  /api/users/profile          # Mi perfil
PUT  /api/users/profile          # Editar perfil
POST /api/users/vehicles         # Agregar auto
GET  /api/users/vehicles         # Ver autos
PUT  /api/users/status           # Online/Offline
PUT  /api/users/location         # Ubicación actual
```

### Carreras
```bash
POST /api/rides                  # Crear carrera
GET  /api/rides/:id              # Ver carrera
GET  /api/my-rides               # Mis carreras
PUT  /api/rides/:id/accept       # Aceptar carrera
PUT  /api/rides/:id/cancel       # Cancelar
PUT  /api/rides/:id/complete     # Completar
```

### Suscripción
```bash
GET  /api/subscriptions/plans    # Ver planes
POST /api/subscriptions/subscribe  # Suscribirse
GET  /api/subscriptions/my-subscription  # Mi suscripción
POST /api/subscriptions/payments/upload  # Comprobante
PUT  /api/subscriptions/payments/:id/verify  # Verificar
```

---

## 🔐 Autenticación

```bash
# 1. Registrarse
POST /api/auth/register
{
  "name": "Juan",
  "cedula": "0102030405",
  "email": "juan@mail.com",
  "password": "123456",
  "phone": "0999999999",
  "role": "cliente"
}

# 2. Login
POST /api/auth/login
{
  "identifier": "juan@mail.com",
  "password": "123456"
}
→ Recibe: { token: "eyJ...", user: {...} }

# 3. Usar en todos los endpoints
Authorization: Bearer eyJ...
```

---

## 📊 Modelos Rápido

| Modelo | Campos Principales |
|--------|-------------------|
| **User** | cedula, email, role, password, isOnline |
| **Vehicle** | type, plate, owner |
| **Ride** | client, driver, pickup, dropoff, price, status |
| **Plan** | name, price, maxVehicles, commission |
| **Subscription** | user, plan, status |
| **Payment** | user, image, amount, status |

---

## 🎯 Roles

```
Admin → Crear planes, verificar pagos
Motorizado → Aceptar carreras, recibir pagos
Cliente → Crear carreras, pagar
```

---

## 💰 Precio

```
precio = max(1.50, distancia_km * 0.50)

Ejemplo:
- 3 km → 3 * 0.50 = 1.50 (mínimo)
- 10 km → 10 * 0.50 = 5.00
- 20 km → 20 * 0.50 = 10.00
```

---

## 🌐 WebSocket Events

```javascript
// Conectar
const socket = io('http://localhost:5000');

// Emitir
socket.emit('driver_online', { driverId: 'xxx' });
socket.emit('driver_location_update', { driverId: 'xxx', lat: -3.99, lng: -79.20 });
socket.emit('ride_accepted', { clientId: 'xxx', rideId: 'xxx' });

// Escuchar
socket.on('driver_available', (data) => {});
socket.on('driver_location', (data) => {});
socket.on('ride_accepted', (data) => {});
```

---

## ⚙️ Configuración (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delivery
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/delivery
JWT_SECRET=your-secret-key
NODE_ENV=development
```

---

## 📁 Estructura

```
backend/
├── models/           (Schemas)
├── controllers/      (Lógica de endpoints)
├── services/         (Lógica de negocio)
├── routes/           (Definición de endpoints)
├── middleware/       (Autenticación)
├── utils/            (Validaciones)
├── server.js         (Servidor)
└── package.json      (Dependencias)
```

---

## 🔍 Verificar Funcionamiento

```bash
# 1. MongoDB conecta
npm run dev
# Deberías ver: "MongoDB conectado"

# 2. Servidor inicia
# Deberías ver: "Servidor corriendo en puerto 5000"

# 3. API responde
curl http://localhost:5000
# Respuesta: "API de Delivery en funcionamiento"

# 4. Registrar usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "cedula": "123456",
    "email": "test@mail.com",
    "password": "123456",
    "role": "cliente"
  }'
```

---

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| ECONNREFUSED | MongoDB no corre | Inicia MongoDB o usa Atlas |
| EADDRINUSE | Puerto en uso | Cambia PORT en .env |
| Invalid token | Token expirado | Login nuevamente |
| No token | No autenticado | Agrega Authorization header |
| User already exists | Email duplicado | Usa otro email |

---

## 📚 Documentación

| Archivo | Para |
|---------|------|
| [START_HERE.md](START_HERE.md) | Comenzar |
| [README.md](README.md) | Instalar |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Entender |
| [API_EXAMPLES.md](API_EXAMPLES.md) | Ejemplos |
| [TESTING.md](TESTING.md) | Probar |
| [DEPLOY.md](DEPLOY.md) | Deploy |

---

## 🎯 Casos de Uso

### Cliente solicita carrera
```
1. POST /api/rides (create)
   ↓
2. Sistema busca motorizados cercanos
   ↓
3. Si hay disponibles, notifica (WebSocket)
```

### Motorizado acepta
```
1. PUT /api/rides/:id/accept
   ↓
2. Cliente notificado (WebSocket)
   ↓
3. Tracking de ubicación en tiempo real
```

### Carrera completada
```
1. PUT /api/rides/:id/complete
   ↓
2. Pago procesado
   ↓
3. Comisión calculada
```

---

## 💾 Base de Datos

```javascript
// Crear índices (opcional pero recomendado)
db.users.createIndex({ email: 1 });
db.users.createIndex({ cedula: 1 });
db.rides.createIndex({ status: 1 });
db.rides.createIndex({ client: 1 });
db.rides.createIndex({ driver: 1 });
```

---

## 🔒 Seguridad

```
✅ Contraseñas: Hasheadas con bcrypt
✅ Autenticación: JWT (24h expiración)
✅ Validación: En todos los inputs
✅ Autorización: Por rol
✅ CORS: Habilitado
✅ Headers: Seguros
```

---

## 🚀 Deploy Rápido

### Heroku
```bash
heroku create app-name
git push heroku main
heroku config:set MONGODB_URI=...
heroku config:set JWT_SECRET=...
heroku open
```

### Railway
```bash
# Conectar GitHub
# Railway hace todo automático
```

---

## 📊 Testing Rápido

### Postman
1. Crear colección
2. Agregar request por endpoint
3. Usar variables para token
4. Ejecutar

### cURL
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"email@mail.com","password":"123456"}'
```

### Thunder Client (VS Code)
1. Instalar extensión
2. Crear requests
3. Ejecutar
4. Ver respuesta

---

## 🔄 Workflows

### Nuevo Endpoint
1. Crear ruta en `routes/`
2. Crear controlador en `controllers/`
3. Crear servicio en `services/` (si es lógica compleja)
4. Agregar validación en `utils/`
5. Probar en Postman

### Agregar Modelo
1. Crear en `models/`
2. Usar en `controllers/`
3. Usar en `services/`
4. Exponer en rutas

---

## 📈 Performance Tips

```javascript
// 1. Usar índices en MongoDB
// 2. Caché de datos frecuentes (Redis)
// 3. Paginación en listados grandes
// 4. Validar input antes de queries
// 5. Usar select() para limitar campos
```

---

## 🎓 Conceptos Clave

```
JWT → Token de autenticación
Bcrypt → Hashing de contraseñas
Socket.IO → WebSockets
Haversine → Distancia entre coordenadas
Middleware → Validación de requests
Service → Lógica de negocio reutilizable
```

---

**Versión**: 1.0.0
**Última actualización**: 9 de enero de 2026
**Status**: ✅ Completo
