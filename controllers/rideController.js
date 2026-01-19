const Ride = require('../models/Ride');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Rating = require('../models/Rating');
const driverService = require('../services/driverService');
const priceService = require('../services/priceService');

// Crear nuevo viaje
exports.createRide = async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation, description } = req.body;

        // Validar ubicaciones
        if (!pickupLocation || !dropoffLocation) {
            return res.status(400).json({ error: 'Se requieren ubicaciones de recogida y entrega' });
        }

        if (!pickupLocation.latitude || !pickupLocation.longitude || !dropoffLocation.latitude || !dropoffLocation.longitude) {
            return res.status(400).json({ error: 'Coordenadas inválidas' });
        }

        // Calcular distancia y precio
        const distance = priceService.calculateDistance(
            pickupLocation.latitude,
            pickupLocation.longitude,
            dropoffLocation.latitude,
            dropoffLocation.longitude
        );

        const price = priceService.calculatePrice(distance);

        // Obtener datos del cliente para enviar en el socket
        const client = await User.findById(req.user.id).select('fullName phone');

        const ride = new Ride({
            client: req.user.id,
            pickupLocation,
            dropoffLocation,
            description: description || '',
            distance,
            price,
            status: 'pending'
        });

        await ride.save();

        // Emitir nueva carrera a todos los motorizados conectados
        const { emitNewRide } = require('../server');
        const rideWithClient = {
            ...ride.toObject(),
            client: {
                _id: req.user.id,
                fullName: client.fullName,
                phone: client.phone
            }
        };
        emitNewRide(rideWithClient);

        res.status(201).json(ride);
    } catch (error) {
        console.error('Error al crear viaje:', error);
        res.status(400).json({ error: error.message || 'Error al crear viaje' });
    }
};

// Obtener detalles completos para tracking del cliente
exports.getRideTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await Ride.findById(id)
            .populate('client', 'fullName phone profileImage')
            .populate('driver', 'fullName phone profileImage rating location isOnline')
            .populate('vehicle');
        
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // Si hay driver asignado, obtener más info
        let driverInfo = null;
        if (ride.driver) {
            // Obtener vehículos activos del motorizado
            const activeVehicle = await Vehicle.findOne({ 
                owner: ride.driver._id, 
                status: 'active' 
            });

            // Obtener rating promedio del motorizado
            const ratingStats = await Rating.getDriverAverageRating(ride.driver._id);
            
            // Obtener últimas 3 calificaciones
            const recentRatings = await Rating.find({ driver: ride.driver._id })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('client', 'fullName');

            driverInfo = {
                _id: ride.driver._id,
                fullName: ride.driver.fullName,
                phone: ride.driver.phone,
                profileImage: ride.driver.profileImage,
                rating: ratingStats.averageRating,
                totalRatings: ratingStats.totalRatings,
                location: ride.driver.location,
                isOnline: ride.driver.isOnline,
                vehicle: activeVehicle ? {
                    _id: activeVehicle._id,
                    type: activeVehicle.type,
                    plate: activeVehicle.plate,
                    vehicleImage: activeVehicle.vehicleImage
                } : null,
                recentRatings: recentRatings.map(r => ({
                    rating: r.rating,
                    comment: r.comment,
                    clientName: r.client?.fullName || 'Cliente',
                    createdAt: r.createdAt
                }))
            };
        }

        res.json({
            ride: {
                _id: ride._id,
                status: ride.status,
                description: ride.description,
                pickupLocation: ride.pickupLocation,
                dropoffLocation: ride.dropoffLocation,
                distance: ride.distance,
                price: ride.price,
                searchTimeout: ride.searchTimeout,
                createdAt: ride.createdAt,
                acceptedAt: ride.acceptedAt,
                startedAt: ride.startedAt,
                completedAt: ride.completedAt
            },
            client: ride.client,
            driver: driverInfo
        });
    } catch (error) {
        console.error('Error al obtener tracking:', error);
        res.status(500).json({ error: 'Error al obtener tracking del viaje' });
    }
};

// Marcar carrera como sin respuesta (timeout)
exports.markNoResponse = async (req, res) => {
    try {
        const { id } = req.params;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        // Solo se puede marcar como no_response si está pending
        if (ride.status !== 'pending') {
            return res.status(400).json({ error: 'El viaje ya no está en espera' });
        }
        
        // Verificar que el cliente es el dueño del viaje
        if (ride.client.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        }
        
        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { status: 'no_response' },
            { new: true }
        );
        
        // Notificar a los motorizados que la carrera ya no está disponible
        const { io } = require('../server');
        io.to('drivers_room').emit('ride_cancelled', { rideId: id });

        res.json(updatedRide);
    } catch (error) {
        console.error('Error al marcar sin respuesta:', error);
        res.status(500).json({ error: error.message || 'Error al marcar sin respuesta' });
    }
};

// Reintentar búsqueda de motorizado
exports.retryRide = async (req, res) => {
    try {
        const { id } = req.params;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        // Solo se puede reintentar si está no_response o pending
        if (!['no_response', 'pending'].includes(ride.status)) {
            return res.status(400).json({ error: 'No se puede reintentar este viaje' });
        }
        
        // Verificar que el cliente es el dueño del viaje
        if (ride.client.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para esta acción' });
        }
        
        // Resetear el viaje a pending
        ride.status = 'pending';
        ride.rejectedBy = []; // Limpiar rechazos para nuevo intento
        await ride.save();
        
        // Re-emitir a motorizados
        const client = await User.findById(req.user.id).select('fullName phone');
        const { emitNewRide } = require('../server');
        const rideWithClient = {
            ...ride.toObject(),
            client: {
                _id: req.user.id,
                fullName: client.fullName,
                phone: client.phone
            }
        };
        emitNewRide(rideWithClient);

        res.json(ride);
    } catch (error) {
        console.error('Error al reintentar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al reintentar viaje' });
    }
};

// Obtener un viaje específico
exports.getRide = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await Ride.findById(id)
            .populate('client', 'fullName phone _id')
            .populate('driver', 'fullName phone _id');
        
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }

        // Verificar si ya existe una calificación del cliente para esta carrera
        const existingRating = await Rating.findOne({ ride: id });
        
        // Agregar campo hasClientRating al resultado
        const rideData = ride.toObject();
        rideData.hasClientRating = !!existingRating;
        rideData.clientRating = existingRating ? {
            rating: existingRating.rating,
            comment: existingRating.comment,
            createdAt: existingRating.createdAt
        } : null;

        res.json(rideData);
    } catch (error) {
        console.error('Error al obtener viaje:', error);
        res.status(500).json({ error: 'Error al obtener viaje' });
    }
};

// Obtener viajes del usuario
exports.getUserRides = async (req, res) => {
    try {
        const rides = await Ride.find({ client: req.user.id })
            .populate('driver', 'fullName phone')
            .sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener viajes' });
    }
};

// Obtener carreras pendientes (disponibles para motorizados)
exports.getPendingRides = async (req, res) => {
    try {
        // Excluir carreras que este motorizado ya rechazó
        const rides = await Ride.find({ 
            status: 'pending',
            rejectedBy: { $ne: req.user.id } // No incluir si el motorizado está en rejectedBy
        })
            .populate('client', 'fullName phone')
            .sort({ createdAt: -1 });
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener carreras pendientes' });
    }
};

// Aceptar un viaje (para motorizado)
exports.acceptRide = async (req, res) => {
    try {
        const { id } = req.params;
        const Subscription = require('../models/Subscription');
        const Plan = require('../models/Plan');
        
        // Verificar que el driver tiene una suscripción activa
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('plan');

        if (!subscription) {
            return res.status(400).json({ 
                error: 'Debes tener una suscripción activa para aceptar viajes',
                requiresSubscription: true
            });
        }

        // Verificar que el viaje existe y está disponible
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        if (ride.status !== 'pending') {
            return res.status(400).json({ error: 'El viaje no está disponible' });
        }

        // Calcular inicio del mes actual
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Contar carreras completadas este mes
        const ridesThisMonth = await Ride.countDocuments({
            driver: req.user.id,
            status: { $in: ['completed', 'in_progress', 'accepted'] },
            createdAt: { $gte: monthStart, $lte: monthEnd }
        });

        // Validar que no ha excedido el límite de carreras del plan
        if (ridesThisMonth >= subscription.plan.maxRidesPerMonth) {
            return res.status(400).json({ 
                error: `Has alcanzado el límite de ${subscription.plan.maxRidesPerMonth} carreras este mes`,
                limitExceeded: true,
                ridesThisMonth,
                maxRidesPerMonth: subscription.plan.maxRidesPerMonth
            });
        }

        // Obtener vehículo activo del motorizado
        const activeVehicle = await Vehicle.findOne({ 
            owner: req.user.id, 
            status: 'active' 
        });
        
        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { 
                driver: req.user.id, 
                status: 'accepted',
                acceptedAt: new Date(),
                vehicle: activeVehicle?._id
            },
            { new: true }
        ).populate('client', 'fullName phone')
         .populate('driver', 'fullName phone profileImage rating location');

        // Emitir evento de carrera aceptada al cliente
        const { io } = require('../server');
        const driverInfo = await User.findById(req.user.id).select('fullName phone profileImage rating location');
        const ratingStats = await Rating.getDriverAverageRating(req.user.id);
        
        console.log('Driver info para emitir:', driverInfo);
        io.to(`client_${ride.client.toString()}`).emit('ride_accepted', {
            rideId: id,
            driver: {
                _id: req.user.id,
                fullName: driverInfo.fullName,
                phone: driverInfo.phone,
                profileImage: driverInfo.profileImage,
                rating: ratingStats.averageRating,
                totalRatings: ratingStats.totalRatings,
                location: driverInfo.location,
                vehicle: activeVehicle ? {
                    type: activeVehicle.type,
                    plate: activeVehicle.plate,
                    vehicleImage: activeVehicle.vehicleImage
                } : null
            }
        });

        console.log('Carrera aceptada emitida al cliente');
        // Notificar a otros motorizados que la carrera ya no está disponible
        io.to('drivers_room').emit('ride_taken', { rideId: id });

        console.log('Notificación enviada a otros motorizados');

        res.json(updatedRide);
    } catch (error) {
        console.error('Error al aceptar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al aceptar viaje' });
    }
};

// Cancelar viaje
exports.cancelRide = async (req, res) => {
    try {
        const { id } = req.params;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { status: 'cancelled' },
            { new: true }
        ).populate('client', 'fullName phone')
         .populate('driver', 'fullName phone');

        res.json(updatedRide);
    } catch (error) {
        console.error('Error al cancelar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al cancelar viaje' });
    }
};

// Iniciar viaje (motorizado llegó al punto de recogida)
exports.startRide = async (req, res) => {
    try {
        const { id } = req.params;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        if (ride.status !== 'accepted') {
            return res.status(400).json({ error: 'El viaje debe estar aceptado para iniciarlo' });
        }
        
        // Verificar que el motorizado es quien aceptó la carrera
        if (ride.driver.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No tienes permiso para iniciar este viaje' });
        }
        
        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { status: 'in_progress', startedAt: new Date() },
            { new: true }
        ).populate('client', 'fullName phone')
         .populate('driver', 'fullName phone');

        // Emitir evento al cliente
        const { io } = require('../server');
        io.to(`ride_${id}`).emit('ride_status_change', {
            rideId: id,
            status: 'in_progress',
            message: 'El motorizado llegó al punto de recogida'
        });
        io.to(`client_${ride.client.toString()}`).emit('ride_started', {
            rideId: id,
            status: 'in_progress'
        });

        res.json(updatedRide);
    } catch (error) {
        console.error('Error al iniciar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al iniciar viaje' });
    }
};

// Completar viaje
exports.completeRide = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        // Guardar cliente antes de actualizar
        const clientId = ride.client.toString();
        
        const updatedRide = await Ride.findByIdAndUpdate(
            id,
            { status: 'completed', rating: rating || 5, completedAt: new Date() },
            { new: true }
        ).populate('client', 'fullName phone')
         .populate('driver', 'fullName phone');

        // Emitir evento al cliente
        const { io } = require('../server');
        console.log('Emitiendo ride_completed para ride:', id);
        io.to(`ride_${id}`).emit('ride_status_change', {
            rideId: id,
            status: 'completed',
            message: 'Carrera completada exitosamente'
        });
        io.to(`client_${clientId}`).emit('ride_completed', {
            rideId: id,
            status: 'completed',
            price: updatedRide.price,
            distance: updatedRide.distance
        });
        console.log('Evento ride_completed emitido para ride:', id);
        res.json(updatedRide);
    } catch (error) {
        console.error('Error al completar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al completar viaje' });
    }
};

// Buscar conductores disponibles
exports.findDrivers = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const drivers = await driverService.findNearbyDrivers(latitude, longitude);
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar conductores' });
    }
};

// Rechazar carrera (el motorizado no quiere esta carrera, no le aparecerá de nuevo)
exports.rejectRide = async (req, res) => {
    try {
        const { id } = req.params;
        const driverId = req.user.id;
        
        const ride = await Ride.findById(id);
        if (!ride) {
            return res.status(404).json({ error: 'Viaje no encontrado' });
        }
        
        if (ride.status !== 'pending') {
            return res.status(400).json({ error: 'El viaje ya no está disponible' });
        }
        
        // Agregar el motorizado a la lista de rechazos (si no está ya)
        if (!ride.rejectedBy.includes(driverId)) {
            ride.rejectedBy.push(driverId);
            await ride.save();
        }
        
        res.json({ 
            message: 'Carrera rechazada correctamente',
            rideId: id,
            rejectedBy: ride.rejectedBy.length
        });
    } catch (error) {
        console.error('Error al rechazar viaje:', error);
        res.status(500).json({ error: error.message || 'Error al rechazar viaje' });
    }
};
