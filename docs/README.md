# Backend de Delivery - Guía de Instalación y Uso

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- MongoDB (local o en la nube)

## Instalación

1. **Clonar o navegar al directorio del proyecto:**
```bash
cd backend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Crear archivo de configuración:**
```bash
cp .env.example .env
```

4. **Editar el archivo `.env`** con tus configuraciones:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/delivery
JWT_SECRET=tu-clave-secreta-muy-segura
NODE_ENV=development
```

## Ejecutar el Servidor

### Modo Desarrollo (con auto-recargas)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:5000`

## Estructura del Proyecto

```
backend/
├── models/              # Modelos de datos (schemas de MongoDB)
├── controllers/         # Controladores (lógica de rutas)
├── services/            # Servicios (lógica de negocio)
├── routes/              # Definición de rutas
├── middleware/          # Middlewares (autenticación, etc)
├── server.js            # Archivo principal
├── package.json         # Dependencias del proyecto
└── ARCHITECTURE.md      # Documentación de arquitectura
```

## Características Implementadas

### ✅ Autenticación y Autorización
- Registro de usuarios con tres roles (admin, motorizado, cliente)
- Login con JWT
- Middleware de autenticación y autorización

### ✅ Gestión de Usuarios
- Crear y actualizar perfil de usuario
- Gestión de vehículos para motorizados
- Estado de conexión (online/offline)
- Actualización de ubicación en tiempo real

### ✅ Sistema de Carreras
- Crear nuevas solicitudes de carrera
- Búsqueda de motorizados disponibles (cercanos)
- Algoritmo de cálculo de precios dinámicos
- Estados de carrera: pendiente, aceptada, en progreso, completada, cancelada

### ✅ Planes y Suscripciones
- Gestión de planes por administrador
- Suscripción de motorizados a planes
- Verificación de comprobantes de pago
- Sistema de comisiones

### ✅ Comunicación en Tiempo Real
- WebSocket para actualizaciones de ubicación
- Notificaciones en tiempo real de carreras
- Estado de conexión de motorizados

## API Endpoints

Ver `API_EXAMPLES.md` para ejemplos completos de todas las APIs.

### Grupos de Endpoints:
- **Autenticación**: `/api/auth/*`
- **Usuarios**: `/api/users/*`
- **Carreras**: `/api/rides/*`
- **Suscripciones**: `/api/subscriptions/*`

## WebSocket Eventos

Eventos disponibles para comunicación en tiempo real:

**Del cliente al servidor:**
- `driver_online` - Motorizado se conecta
- `driver_offline` - Motorizado se desconecta
- `driver_location_update` - Actualizar ubicación
- `ride_accepted` - Carrera aceptada
- `driver_arriving` - Motorizado llegando

**Del servidor al cliente:**
- `driver_available` - Motorizado disponible
- `driver_unavailable` - Motorizado no disponible
- `driver_location` - Nueva ubicación
- `ride_accepted` - Carrera fue aceptada
- `driver_arriving` - Motorizado está llegando

## Pruebas

Para probar los endpoints, puedes usar:
- **Postman**: Importar colección de requests
- **cURL**: Usar comandos en terminal
- **Thunder Client**: Extensión de VS Code

## Base de Datos

### Colecciones MongoDB:

1. **users** - Información de usuarios
2. **vehicles** - Vehículos de motorizados
3. **rides** - Solicitudes de carreras
4. **plans** - Planes de suscripción
5. **subscriptions** - Suscripciones de usuarios
6. **payments** - Comprobantes de pago

## Consideraciones de Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación con JWT
- ✅ Validación de datos de entrada
- ✅ Middleware de autorización por rol
- ✅ CORS configurado
- ✅ Variables de entorno protegidas

## Próximos Pasos

1. Implementar validaciones más robustas con `joi` o `yup`
2. Agregar tests unitarios e integración
3. Implementar logging con `winston`
4. Agregar rate limiting
5. Configurar CI/CD pipeline
6. Documentación con Swagger
7. Monitoreo y alertas

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: 2026-01-09
