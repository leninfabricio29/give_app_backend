const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

// Exportar io para usar en otros módulos
module.exports = { io };

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Conexión a MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.log('Error MongoDB:', err));

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const driverRoutes = require('./routes/driverRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', rideRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', driverRoutes);

// Almacenar conexiones de motorizados online
const onlineDrivers = new Map(); // { driverId: socketId }
const clientSockets = new Map(); // { clientId: socketId }

// WebSocket Events
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // Motorizado se conecta y se une a la sala de motorizados
    socket.on('driver_connect', (data) => {
        const { driverId } = data;
        socket.join('drivers_room'); // Sala general de motorizados
        socket.join(`driver_${driverId}`); // Sala individual
        onlineDrivers.set(driverId, socket.id);
        console.log(`Motorizado ${driverId} conectado. Total online: ${onlineDrivers.size}`);
    });

    // Motorizado se desconecta
    socket.on('driver_disconnect', (data) => {
        const { driverId } = data;
        socket.leave('drivers_room');
        socket.leave(`driver_${driverId}`);
        onlineDrivers.delete(driverId);
        console.log(`Motorizado ${driverId} desconectado. Total online: ${onlineDrivers.size}`);
    });

    // Cliente se conecta
    socket.on('client_connect', (data) => {
        const { clientId } = data;
        socket.join(`client_${clientId}`);
        clientSockets.set(clientId, socket.id);
        console.log(`Cliente ${clientId} conectado`);
    });

    // Cliente se desconecta explícitamente
    socket.on('client_disconnect', (data) => {
        const { clientId } = data;
        socket.leave(`client_${clientId}`);
        clientSockets.delete(clientId);
        console.log(`Cliente ${clientId} desconectado`);
    });

    // Cliente se une a sala de carrera específica para tracking
    socket.on('join_ride_room', (data) => {
        const { rideId, userId } = data;
        socket.join(`ride_${rideId}`);
        console.log(`Usuario ${userId} se unió a sala ride_${rideId}`);
    });

    // Salir de sala de carrera
    socket.on('leave_ride_room', (data) => {
        const { rideId, userId } = data;
        socket.leave(`ride_${rideId}`);
        console.log(`Usuario ${userId} salió de sala ride_${rideId}`);
    });

    // Actualizar ubicación del motorizado
    socket.on('driver_location_update', (data) => {
        const { driverId, rideId, location } = data;
        // Emitir al cliente que tiene carrera con este motorizado
        if (rideId) {
            io.to(`ride_${rideId}`).emit('driver_location', {
                driverId,
                location,
                timestamp: new Date()
            });
        }
    });

    // Motorizado acepta carrera (evento directo del socket)
    /*socket.on('ride_accepted', async (data) => {
    console.log('Evento ride_accepted recibido:', data);
    const { rideId, clientId, driverId, driverName } = data;
    
    try {
        // Obtener información completa del driver desde la base de datos
        const driver = await User.findById(driverId)

            .select('fullName phone profileImage rating totalRatings location vehicle recentRatings');
            
        console.log('Datos del driver obtenidos:', driver);
        io.to(`client_${clientId}`).emit('ride_accepted', {
            rideId,
            driver,  // ✅ Enviar objeto completo del driver
            driverId,
            driverName,
            message: 'Tu carrera ha sido aceptada'
        });
        
        // También emitir a la sala del ride para tracking
        io.to(`ride_${rideId}`).emit('ride_accepted', {
            rideId,
            driver,
            driverId,
            driverName,
            message: 'Tu carrera ha sido aceptada'
        });
        
        // Notificar a otros motorizados
        socket.to('drivers_room').emit('ride_taken', { rideId });
        
    } catch (error) {
        console.error('Error obteniendo datos del driver:', error);
    }
});*/

    // Motorizado inicia la carrera (llegó al punto de recogida)
    socket.on('ride_started', (data) => {
        const { rideId, clientId } = data;
        io.to(`ride_${rideId}`).emit('ride_status_change', {
            rideId,
            status: 'in_progress',
            message: 'El motorizado llegó al punto de recogida'
        });
    });

    // Carrera completada
    socket.on('ride_completed', (data) => {
        const { rideId, clientId } = data;
        io.to(`ride_${rideId}`).emit('ride_status_change', {
            rideId,
            status: 'completed',
            message: 'Carrera completada'
        });
        io.to(`client_${clientId}`).emit('ride_completed', data);
    });

    // Carrera cancelada
    socket.on('ride_cancelled', (data) => {
        const { rideId, reason } = data;
        io.to(`ride_${rideId}`).emit('ride_status_change', {
            rideId,
            status: 'cancelled',
            message: reason || 'Carrera cancelada'
        });
    });

    socket.on('disconnect', () => {
        // Limpiar del mapa si estaba registrado como motorizado
        for (const [driverId, socketId] of onlineDrivers.entries()) {
            if (socketId === socket.id) {
                onlineDrivers.delete(driverId);
                console.log(`Motorizado ${driverId} desconectado por cierre. Total online: ${onlineDrivers.size}`);
                break;
            }
        }
        // Limpiar del mapa si estaba registrado como cliente
        for (const [clientId, socketId] of clientSockets.entries()) {
            if (socketId === socket.id) {
                clientSockets.delete(clientId);
                console.log(`Cliente ${clientId} desconectado por cierre`);
                break;
            }
        }
        console.log('Cliente desconectado:', socket.id);
    });
});

// Función para emitir nueva carrera a todos los motorizados
const emitNewRide = (ride) => {
    io.to('drivers_room').emit('new_ride', ride);
    console.log('Nueva carrera emitida a motorizados:', ride._id);
};

// Exportar función para usar en controladores
module.exports.emitNewRide = emitNewRide;

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de Delivery en funcionamiento');
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});