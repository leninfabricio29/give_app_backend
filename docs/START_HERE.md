# 🚀 START HERE - Comienza Aquí

## Bienvenido al Backend de Delivery API

Este es un **backend completamente funcional** para una aplicación de delivery de motorizados.

---

## ⚡ 3 Pasos para Empezar

### 1️⃣ Instalar
```bash
cd backend
npm install
```

### 2️⃣ Configurar
```bash
cp .env.example .env
# Edita .env con tu configuración (especialmente MONGODB_URI)
```

### 3️⃣ Ejecutar
```bash
npm run dev
```

**Listo!** El servidor estará en `http://localhost:5000`

---

## 📚 Documentos por Propósito

### 🎯 Si quieres...

| Objetivo | Documento |
|----------|-----------|
| Instalar y usar | [README.md](README.md) |
| Entender la arquitectura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Ver ejemplos de APIs | [API_EXAMPLES.md](API_EXAMPLES.md) |
| Probar los endpoints | [TESTING.md](TESTING.md) |
| Deploy a producción | [DEPLOY.md](DEPLOY.md) |
| Conocer qué se hizo | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Ver resumen visual | [SUMMARY.md](SUMMARY.md) |
| Verificar completitud | [CHECKLIST.md](CHECKLIST.md) |
| Índice general | [INDEX.md](INDEX.md) |

---

## 🎬 Primer Request de Prueba

Abre Postman, Thunder Client o usa cURL:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Juan García",
  "cedula": "0102030405",
  "email": "juan@example.com",
  "password": "password123",
  "phone": "0999999999",
  "role": "cliente"
}
```

**Deberías recibir** (Status 201):
```json
{
  "message": "User registered successfully",
  "user": { ... }
}
```

---

## 🗂️ Estructura Rápida

```
backend/
├── models/          → Esquemas de MongoDB
├── controllers/     → Lógica de endpoints
├── services/        → Lógica de negocio
├── routes/          → Definición de rutas
├── middleware/      → Autenticación
├── utils/           → Validaciones
├── server.js        → Servidor principal
└── [10 documentos]  → Guías completas
```

---

## 🔐 Autenticación (Importante)

Después de registrarte, haz login:

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "identifier": "juan@example.com",
  "password": "password123"
}
```

**Obtendrás un token JWT**, úsalo en futuros requests:

```bash
GET http://localhost:5000/api/users/profile
Authorization: Bearer {tu_token}
```

---

## 🌐 WebSockets (Tiempo Real)

```javascript
// Ejemplo en frontend (Cliente.js)
const io = require('socket.io-client');
const socket = io('http://localhost:5000');

// Motorizado se conecta
socket.emit('driver_online', { driverId: 'xxx' });

// Escuchar eventos
socket.on('driver_available', (data) => {
  console.log('Motorizado disponible:', data);
});
```

---

## 📊 20 Endpoints Disponibles

```
Auth (2)
├── POST /api/auth/register
└── POST /api/auth/login

Users (6)
├── GET /api/users/profile
├── PUT /api/users/profile
├── POST /api/users/vehicles
├── GET /api/users/vehicles
├── PUT /api/users/status
└── PUT /api/users/location

Rides (6)
├── POST /api/rides
├── GET /api/rides/:id
├── GET /api/my-rides
├── PUT /api/rides/:id/accept
├── PUT /api/rides/:id/cancel
└── PUT /api/rides/:id/complete

Subscriptions (6)
├── GET /api/subscriptions/plans
├── POST /api/subscriptions/plans
├── POST /api/subscriptions/subscribe
├── GET /api/subscriptions/my-subscription
├── POST /api/subscriptions/payments/upload
└── PUT /api/subscriptions/payments/:id/verify
```

---

## ⚙️ Configuración (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delivery
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

**Para MongoDB Atlas** (en la nube):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/delivery
```

---

## 🎓 Conceptos Clave

### 1. Roles
- **Admin**: Gestiona planes y verifica pagos
- **Motorizado**: Acepta carreras y recibe pagos
- **Cliente**: Crea carreras y paga

### 2. Flujo Principal
```
Cliente crea carrera 
→ Sistema busca motorizados cercanos
→ Motorizado acepta (WebSocket)
→ Ubicación en tiempo real
→ Carrera completada
```

### 3. Precios
```
precio = max(1.50, distancia_km * 0.50)
```

### 4. Búsqueda de Motorizados
- Filtrar por suscripción activa
- Filtrar por online (isOnline: true)
- Calcular distancia (Haversine)
- Ordenar por proximidad

---

## 🔍 Verificar que Funciona

```bash
# 1. Ver si MongoDB conecta
npm run dev

# 2. Ver si el servidor inicia
# Deberías ver: "MongoDB conectado" y "Servidor corriendo en puerto 5000"

# 3. Probar endpoint raíz
curl http://localhost:5000
# Respuesta: "API de Delivery en funcionamiento"
```

---

## 🚨 Errores Comunes

### Error: `connect ECONNREFUSED`
**Problema**: MongoDB no está corriendo
**Solución**: Inicia MongoDB o configura Atlas en .env

### Error: `EADDRINUSE: address already in use :::5000`
**Problema**: Puerto 5000 en uso
**Solución**: Cambia PORT en .env o mata el proceso

### Error: `Invalid token`
**Problema**: Token expirado o incorrecto
**Solución**: Haz login nuevamente para obtener nuevo token

---

## 📖 Siguiente Lectura

1. **Instalar**: [README.md](README.md)
2. **Aprender**: [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Probar**: [TESTING.md](TESTING.md)
4. **Ejemplos**: [API_EXAMPLES.md](API_EXAMPLES.md)

---

## 🎯 Checklist de Setup Inicial

- [ ] `npm install` ejecutado
- [ ] `.env` creado y configurado
- [ ] MongoDB está corriendo (local o Atlas)
- [ ] `npm run dev` iniciado sin errores
- [ ] Puedo acceder a `http://localhost:5000`
- [ ] Puedo registrar un usuario
- [ ] Puedo hacer login
- [ ] Recibo JWT válido

---

## 💬 Ayuda Rápida

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo (con auto-reload)
npm run dev

# Iniciar en producción
npm start

# Ver logs
npm run dev 2>&1 | tee logs.txt
```

---

## 🌟 Lo que Tienes

✅ **20 endpoints funcionales**
✅ **WebSockets para tiempo real**
✅ **Autenticación segura (JWT)**
✅ **Algoritmo de búsqueda geográfica**
✅ **Cálculo de precios dinámico**
✅ **Sistema de suscripciones**
✅ **Gestión de pagos**
✅ **Documentación completa**

---

## 🚀 Próximo Paso

Después de familiarizarte con el backend, puedes:

1. Desarrollar el frontend con Next.js
2. Integrar con Cloudinary para imágenes
3. Agregar notificaciones push
4. Deploy a producción
5. Agregar más validaciones y tests

---

## 📞 Documentos Disponibles

- `README.md` - Guía de instalación
- `ARCHITECTURE.md` - Detalles técnicos
- `API_EXAMPLES.md` - Ejemplos de APIs
- `TESTING.md` - Cómo probar
- `DEVELOPMENT.md` - Resumen del trabajo
- `DEPLOY.md` - Guía de deployment
- `INDEX.md` - Índice del proyecto
- `SUMMARY.md` - Resumen visual
- `CHECKLIST.md` - Verificación de completitud
- `CONCLUSION.md` - Conclusión final

---

## ✨ ¡Listo para Comenzar!

El backend está completamente funcional. 

**¿Qué hace falta?** Únicamente:
1. Instalar dependencias (`npm install`)
2. Configurar variables (`.env`)
3. Iniciar servidor (`npm run dev`)

¡Éxito! 🎉

---

**Versión**: 1.0.0
**Fecha**: 9 de enero de 2026
**Estado**: ✅ Completado y Funcional
