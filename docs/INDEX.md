# Índice del Proyecto - Backend Delivery API

## 📋 Documentación Principal

1. **[README.md](README.md)** - Guía de instalación y uso general
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detalles de arquitectura, modelos y endpoints
3. **[API_EXAMPLES.md](API_EXAMPLES.md)** - Ejemplos de uso de todos los endpoints
4. **[TESTING.md](TESTING.md)** - Guía rápida de pruebas
5. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Resumen de desarrollo completado

## 📁 Estructura del Proyecto

```
backend/
├── 📄 Documentación
│   ├── README.md           ← Comienza aquí
│   ├── ARCHITECTURE.md     ← Detalles técnicos
│   ├── API_EXAMPLES.md     ← Ejemplos de APIs
│   ├── TESTING.md          ← Cómo probar
│   ├── DEVELOPMENT.md      ← Resumen del trabajo
│   └── INDEX.md            ← Este archivo
│
├── 📂 models/              ← Esquemas de MongoDB
│   ├── User.js             (Usuarios, roles, ubicación)
│   ├── Vehicle.js          (Vehículos de motorizados)
│   ├── Ride.js             (Carreras/solicitudes)
│   ├── Plan.js             (Planes de suscripción)
│   ├── Subscription.js     (Suscripciones activas)
│   └── Payment.js          (Comprobantes de pago)
│
├── 📂 controllers/         ← Lógica de rutas HTTP
│   ├── authController.js       (Login/Register)
│   ├── userController.js       (Perfiles, vehículos)
│   ├── rideController.js       (Carreras)
│   └── subscriptionController.js (Planes, pagos)
│
├── 📂 services/            ← Lógica de negocio
│   ├── authService.js      (JWT, contraseñas, validación)
│   ├── priceService.js     (Haversine, cálculo de precios)
│   └── driverService.js    (Búsqueda de motorizados)
│
├── 📂 routes/              ← Definición de rutas
│   ├── authRoutes.js           (POST /api/auth/*)
│   ├── userRoutes.js           (GET/PUT /api/users/*)
│   ├── rideRoutes.js           (POST/PUT /api/rides/*)
│   └── subscriptionRoutes.js   (GET/POST /api/subscriptions/*)
│
├── 📂 middleware/          ← Validación y autorización
│   └── authMiddleware.js   (JWT, permisos por rol)
│
├── 📂 utils/               ← Funciones reutilizables
│   └── validators.js       (Validaciones de entrada)
│
├── 📄 server.js            ← Archivo principal (Express + WebSockets)
├── 📄 package.json         ← Dependencias npm
├── 📄 .env.example         ← Plantilla de variables de entorno
└── 📄 .gitignore          ← Archivos ignorados en git
```

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar ambiente
cp .env.example .env

# 3. Iniciar servidor
npm run dev
```

**URL Base**: `http://localhost:5000`

## 📊 Estadísticas del Proyecto

- **Modelos de Datos**: 6
- **Controladores**: 4
- **Servicios**: 3
- **Rutas (Endpoints)**: 20
- **Middlewares**: 1
- **WebSocket Events**: 7
- **Líneas de Código**: ~2000+

## 🔐 Autenticación

Todos los endpoints (excepto login/register y obtener planes) requieren:

```
Authorization: Bearer {JWT_TOKEN}
```

## 🎯 Endpoints por Módulo

### Auth (2 endpoints)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Users (6 endpoints)
- `GET /api/users/profile` - Obtener perfil
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/vehicles` - Agregar vehículo
- `GET /api/users/vehicles` - Listar vehículos
- `PUT /api/users/status` - Cambiar estado (online/offline)
- `PUT /api/users/location` - Actualizar ubicación

### Rides (6 endpoints)
- `POST /api/rides` - Crear carrera
- `GET /api/rides/:id` - Obtener detalle
- `GET /api/my-rides` - Mis carreras
- `PUT /api/rides/:id/accept` - Aceptar carrera
- `PUT /api/rides/:id/cancel` - Cancelar carrera
- `PUT /api/rides/:id/complete` - Completar carrera

### Subscriptions (6 endpoints)
- `GET /api/subscriptions/plans` - Listar planes
- `POST /api/subscriptions/plans` - Crear plan (admin)
- `POST /api/subscriptions/subscribe` - Suscribirse
- `GET /api/subscriptions/my-subscription` - Mi suscripción
- `POST /api/subscriptions/payments/upload` - Subir comprobante
- `PUT /api/subscriptions/payments/:id/verify` - Verificar pago

## 🔄 Flujo Principal

```
1. Cliente/Motorizado → Registrarse → Login → Recibe JWT
2. Con JWT → Accede a endpoints protegidos
3. Cliente crea carrera → Sistema busca motorizados cercanos
4. Motorizado acepta → Notificación via WebSocket
5. Motorizado actualiza ubicación → Cliente ve en tiempo real
6. Carrera completada → Pago procesado
```

## 🗄️ Base de Datos (MongoDB)

### Colecciones

1. **users** - Información de usuarios, roles, ubicación
2. **vehicles** - Vehículos registrados
3. **rides** - Solicitudes de carreras
4. **plans** - Planes de suscripción disponibles
5. **subscriptions** - Suscripciones activas de usuarios
6. **payments** - Comprobantes de pago enviados

## 🔧 Configuración

Variables de entorno en `.env`:

```env
PORT=5000                                    # Puerto del servidor
MONGODB_URI=mongodb://localhost:27017/delivery  # URL de MongoDB
JWT_SECRET=your-secret-key                  # Clave para JWT
NODE_ENV=development                        # Ambiente
```

## 🌐 WebSocket Events

**Cliente conecta y emite**:
- `driver_online` - Motorizado conecta
- `driver_offline` - Motorizado desconecta
- `driver_location_update` - Actualizar ubicación
- `ride_accepted` - Carrera aceptada
- `driver_arriving` - Motorizado llegando

**Servidor emite**:
- `driver_available` - Hay un motorizado disponible
- `driver_unavailable` - Motorizado no disponible
- `driver_location` - Ubicación actualizada
- `ride_accepted` - Tu carrera fue aceptada
- `driver_arriving` - Motorizado está llegando

## 📝 Algoritmos Implementados

### 1. Fórmula de Haversine
Calcula distancia entre dos coordenadas GPS:
- Entrada: lat1, lon1, lat2, lon2
- Salida: distancia en km

### 2. Cálculo de Precio
```
precio = max(1.50, distancia_km * 0.50)
```

### 3. Búsqueda de Motorizados
1. Filtrar activos y online
2. Filtrar con suscripción
3. Calcular distancia
4. Ordenar por proximidad

## 🔒 Seguridad

✅ Contraseñas hasheadas (bcrypt)
✅ Autenticación JWT
✅ Validación de entrada
✅ Middleware de autorización
✅ CORS configurado
✅ Variables de entorno protegidas

## 📚 Documentación por Archivo

| Archivo | Propósito |
|---------|-----------|
| server.js | Configuración principal, Express, WebSockets |
| models/* | Esquemas MongoDB, tipos de datos |
| controllers/* | Handlers de peticiones HTTP |
| services/* | Lógica de negocio reutilizable |
| routes/* | Definición de endpoints y métodos HTTP |
| middleware/* | Verificación de autenticación y permisos |
| utils/* | Funciones auxiliares y validaciones |

## 🧪 Testing

Guía completa en [TESTING.md](TESTING.md)

Herramientas sugeridas:
- Postman (UI) 
- Thunder Client (VS Code)
- cURL (Terminal)

## 📈 Escalabilidad Futura

Sugerencias de mejora:

1. **Caché**: Redis para datos frecuentes
2. **Logging**: Winston para logs estructurados
3. **Monitoring**: APM (New Relic, Datadog)
4. **Queue**: RabbitMQ para procesos async
5. **Tests**: Jest para testing automatizado
6. **API Docs**: Swagger para documentación interactiva
7. **Rate Limiting**: Protección contra abuso
8. **CDN**: Cloudinary para imágenes

## ❓ FAQ

**P: ¿Cómo cambio la puerto?**
R: Modifica `PORT` en `.env`

**P: ¿Cómo conecto a MongoDB Atlas?**
R: Actualiza `MONGODB_URI` en `.env` con tu URL de Atlas

**P: ¿Cómo genero un nuevo JWT?**
R: Haz login con `/api/auth/login`

**P: ¿Puedo usar esto en producción?**
R: Sí, con mejoras de seguridad (cambiar JWT_SECRET, usar HTTPS, etc)

## 🤝 Contribución

Cuando agregues nuevo código:
1. Sigue la estructura existente
2. Agrega validaciones
3. Comenta código complejo
4. Actualiza documentación

## 📞 Soporte

Revisa primero:
1. [README.md](README.md) - Instalación
2. [TESTING.md](TESTING.md) - Pruebas
3. [API_EXAMPLES.md](API_EXAMPLES.md) - Ejemplos

---

**Última actualización**: 9 de enero de 2026
**Estado**: ✅ Completado y funcional

¡Listo para comenzar! 🚀
