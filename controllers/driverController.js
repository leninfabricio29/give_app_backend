const Ride = require('../models/Ride');
const User = require('../models/User');
const Rating = require('../models/Rating');
const FcmDevice = require('../models/FcmDevice');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const mongoose = require('mongoose');

const admin = require('firebase-admin');



/**
 * GET /driver/home-summary
 * Resumen del home para motorizados - Optimizado para móvil
 * Respuesta pequeña con datos agregados
 */
exports.getHomeSummary = async (req, res) => {
    try {
        const driverId = req.user.id;

        // Obtener inicio y fin del día actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Inicio del mes actual
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Ejecutar todas las consultas en paralelo para mejor performance
        const [
            todayRides,
            monthRides,
            ratingStats,
            subscription,
            user
        ] = await Promise.all([
            // Carreras completadas HOY
            Ride.aggregate([
                {
                    $match: {
                        driver: new mongoose.Types.ObjectId(driverId),
                        status: 'completed',
                        updatedAt: { $gte: today, $lt: tomorrow }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalEarnings: { $sum: '$price' },
                        totalDistance: { $sum: '$distance' }
                    }
                }
            ]),

            // Carreras del MES (para límite del plan)
            Ride.countDocuments({
                driver: driverId,
                status: { $in: ['completed', 'in_progress', 'accepted'] },
                createdAt: { $gte: monthStart, $lte: monthEnd }
            }),

            // Rating promedio
            Rating.getDriverAverageRating(driverId),

            // Suscripción activa con plan
            Subscription.findOne({
                user: driverId,
                status: 'active'
            }).populate('plan').lean(),

            // Datos del usuario
            User.findById(driverId).select('isOnline fullName profileImage').lean()
        ]);

        // Procesar resultados
        const todayStats = todayRides[0] || { count: 0, totalEarnings: 0, totalDistance: 0 };

        // Calcular carreras restantes del plan
        const maxRides = subscription?.plan?.maxRidesPerMonth || 0;
        const ridesRemaining = Math.max(0, maxRides - monthRides);
        const ridesUsedPercent = maxRides > 0 ? Math.round((monthRides / maxRides) * 100) : 0;

        // Calcular comisión de la plataforma
        const commissionPercent = subscription?.plan?.commissionPercent || 15;
        const grossEarnings = todayStats.totalEarnings;
        const commission = grossEarnings * (commissionPercent / 100);
        const netEarnings = grossEarnings - commission;

        // Respuesta optimizada para móvil
        res.json({
            // Estado del motorizado
            driver: {
                fullName: user?.fullName || '',
                profileImage: user?.profileImage || null,
                isOnline: user?.isOnline || false
            },

            // Estadísticas de HOY (métricas principales)
            today: {
                ridesCompleted: todayStats.count,
                grossEarnings: Math.round(grossEarnings * 100) / 100,
                netEarnings: Math.round(netEarnings * 100) / 100,
                commission: Math.round(commission * 100) / 100,
                totalDistance: Math.round(todayStats.totalDistance * 100) / 100
            },

            // Rating
            rating: {
                average: ratingStats.averageRating,
                totalReviews: ratingStats.totalRatings
            },

            // Plan y límites
            plan: {
                name: subscription?.plan?.name || 'Sin Plan',
                ridesUsedThisMonth: monthRides,
                ridesRemaining: ridesRemaining,
                maxRidesPerMonth: maxRides,
                usagePercent: ridesUsedPercent,
                commissionPercent: commissionPercent,
                isNearLimit: ridesUsedPercent >= 80,
                hasReachedLimit: ridesRemaining === 0
            },

            // Alertas inteligentes (basadas en uso)
            alerts: generateAlerts(ridesUsedPercent, ridesRemaining, todayStats.count)
        });

    } catch (error) {
        console.error('Error en home-summary:', error);
        res.status(500).json({ error: 'Error al obtener resumen del home' });
    }
};

/**
 * GET /driver/earnings
 * Historial de ganancias con filtros
 */
exports.getEarnings = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { period = 'week' } = req.query; // 'today', 'week', 'month', 'all'

        // Calcular fecha de inicio según período
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        switch (period) {
            case 'today':
                // Ya está configurado
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'all':
                startDate = new Date(0); // Desde el inicio
                break;
        }

        // Obtener suscripción para calcular comisión
        const subscription = await Subscription.findOne({
            user: driverId,
            status: 'active'
        }).populate('plan').lean();

        const commissionPercent = subscription?.plan?.commissionPercent || 15;

        // Estadísticas agregadas
        const stats = await Ride.aggregate([
            {
                $match: {
                    driver: new mongoose.Types.ObjectId(driverId),
                    status: 'completed',
                    updatedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRides: { $sum: 1 },
                    grossEarnings: { $sum: '$price' },
                    totalDistance: { $sum: '$distance' },
                    avgRidePrice: { $avg: '$price' }
                }
            }
        ]);

        // Ganancias por día (para gráfico)
        const dailyEarnings = await Ride.aggregate([
            {
                $match: {
                    driver: new mongoose.Types.ObjectId(driverId),
                    status: 'completed',
                    updatedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
                    },
                    rides: { $sum: 1 },
                    earnings: { $sum: '$price' }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]);

        // Lista de carreras recientes
        const recentRides = await Ride.find({
            driver: driverId,
            status: 'completed',
            updatedAt: { $gte: startDate }
        })
            .select('description price distance updatedAt pickupLocation dropoffLocation')
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean();

        const grossTotal = stats[0]?.grossEarnings || 0;
        const commission = grossTotal * (commissionPercent / 100);
        const netTotal = grossTotal - commission;

        res.json({
            period,
            summary: {
                totalRides: stats[0]?.totalRides || 0,
                grossEarnings: Math.round(grossTotal * 100) / 100,
                commission: Math.round(commission * 100) / 100,
                netEarnings: Math.round(netTotal * 100) / 100,
                totalDistance: Math.round((stats[0]?.totalDistance || 0) * 100) / 100,
                avgRidePrice: Math.round((stats[0]?.avgRidePrice || 0) * 100) / 100,
                commissionPercent
            },
            dailyBreakdown: dailyEarnings.map(day => ({
                date: day._id,
                rides: day.rides,
                grossEarnings: Math.round(day.earnings * 100) / 100,
                netEarnings: Math.round(day.earnings * (1 - commissionPercent / 100) * 100) / 100
            })),
            recentRides: recentRides.map(ride => ({
                _id: ride._id,
                description: ride.description,
                price: ride.price,
                netPrice: Math.round(ride.price * (1 - commissionPercent / 100) * 100) / 100,
                distance: ride.distance,
                date: ride.updatedAt,
                pickup: ride.pickupLocation?.address,
                dropoff: ride.dropoffLocation?.address
            }))
        });

    } catch (error) {
        console.error('Error en earnings:', error);
        res.status(500).json({ error: 'Error al obtener ganancias' });
    }
};

/**
 * GET /driver/ratings
 * Calificaciones recibidas por el motorizado
 */
exports.getMyRatings = async (req, res) => {
    try {
        const driverId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Obtener estadísticas de rating
        const [ratingStats, distribution] = await Promise.all([
            Rating.getDriverAverageRating(driverId),
            Rating.getDriverRatingDistribution(driverId)
        ]);

        // Obtener lista de ratings paginada
        const ratings = await Rating.find({ driver: driverId })
            .populate('client', 'fullName profileImage')
            .populate('ride', 'description pickupLocation dropoffLocation price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Contar total para paginación
        const totalRatings = await Rating.countDocuments({ driver: driverId });

        res.json({
            summary: {
                averageRating: ratingStats.averageRating,
                totalRatings: ratingStats.totalRatings,
                distribution
            },
            ratings: ratings.map(r => ({
                _id: r._id,
                rating: r.rating,
                comment: r.comment,
                tags: r.tags,
                client: {
                    fullName: r.client?.fullName || 'Cliente',
                    profileImage: r.client?.profileImage
                },
                ride: {
                    description: r.ride?.description,
                    price: r.ride?.price
                },
                driverResponse: r.driverResponse,
                createdAt: r.createdAt
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalRatings / parseInt(limit)),
                totalItems: totalRatings,
                hasMore: skip + ratings.length < totalRatings
            }
        });

    } catch (error) {
        console.error('Error en ratings:', error);
        res.status(500).json({ error: 'Error al obtener calificaciones' });
    }
};

/**
 * POST /ratings
 * Crear calificación (cliente califica al motorizado)
 */
exports.createRating = async (req, res) => {
    try {
        const { ride: rideId, rideId: altRideId, rating, comment, tags } = req.body;
        const clientId = req.user.id;

        // Aceptar tanto 'ride' como 'rideId'
        const actualRideId = rideId || altRideId;

        // Validar que la carrera existe y está completada
        const ride = await Ride.findById(actualRideId);
        if (!ride) {
            return res.status(404).json({ error: 'Carrera no encontrada' });
        }

        if (ride.status !== 'completed') {
            return res.status(400).json({ error: 'Solo puedes calificar carreras completadas' });
        }

        if (ride.client.toString() !== clientId) {
            return res.status(403).json({ error: 'Solo el cliente puede calificar esta carrera' });
        }

        // Verificar que no existe ya un rating para esta carrera
        const existingRating = await Rating.findOne({ ride: actualRideId });
        if (existingRating) {
            return res.status(400).json({ error: 'Esta carrera ya fue calificada' });
        }

        // Crear el rating
        const newRating = new Rating({
            ride: actualRideId,
            client: clientId,
            driver: ride.driver,
            rating,
            comment,
            tags
        });

        await newRating.save();

        //Crear la notificación para el motorizado
        const notification = new Notification({
            user: ride.driver,
            title: 'Nueva calificación recibida 🎉',
            message: `Has recibido una nueva calificación de ${rating} estrellas.`,
            relatedRide: actualRideId
        });
        await notification.save();


        const clientUser = await User.findById(ride.client);

        //Enviar notificación push al motorizado usando FCM
        const fcmDevice = await FcmDevice.findOne({ user: ride.driver });
        if (!fcmDevice || !fcmDevice.deviceToken) {
            console.log('No se encontró token FCM para el motorizado:', ride.driver.toString());
        } else {
            await admin.messaging().send({
                token: fcmDevice.deviceToken,
                notification: {
                    title: 'Nueva calificación recibida 🎉',
                    body: `Has recibido una nueva calificación de ${rating} estrellas por parte de ${clientUser?.fullName || 'un cliente'}.`,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default'
                    },
                },
                data: {
                    rideId: actualRideId.toString(),
                    type: 'new_rating',
                },
            });
        }



        //Actualizar puntos del cliente que califica
        await User.findByIdAndUpdate(req.user.id, { $inc: { points: 10 } });



        const notificationUser = new Notification({
            user: req.user.id,
            title: 'Haz ganado puntos 🎉',
            message: `Has recibido 10 puntos por calificar una carrera.`,
            relatedRide: actualRideId
        });
        await notificationUser.save();


        //Enviar notificacion push cuando el cliente gana puntos
        const fcmDeviceUser = await FcmDevice.findOne({ user: req.user.id });
        if (!fcmDeviceUser || !fcmDeviceUser.deviceToken) {
            console.log('No se encontró token FCM para el cliente:', req.user.id);
        } else {
            await admin.messaging().send({
                token: fcmDeviceUser.deviceToken,
                notification: {
                    title: '¡Has ganado puntos! 🎉',
                    body: `Has recibido 10 puntos por calificar una carrera.`,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default'
                    },
                },
                data: {
                    rideId: actualRideId.toString(),
                    type: 'new_points',
                },
            });
        }

        

        //emitir socket de nueva notificación si el motorizado está online
        const { io } = require('../server');

        io.emit('new_notification', {
            rider: ride.driver.toString(),
        });

        //console.log('Notificación de nueva calificación enviada al motorizado:', ride.driver.toString());


        // Actualizar el rating en la carrera
        await Ride.findByIdAndUpdate(actualRideId, { rating });

        // Actualizar rating promedio del motorizado
        const ratingStats = await Rating.getDriverAverageRating(ride.driver);
        await User.findByIdAndUpdate(ride.driver, {
            rating: ratingStats.averageRating
        });

        res.status(201).json({
            message: 'Calificación enviada correctamente',
            rating: {
                _id: newRating._id,
                rating: newRating.rating,
                comment: newRating.comment
            }
        });

    } catch (error) {
        console.error('Error al crear rating:', error);
        res.status(500).json({ error: 'Error al crear calificación' });
    }
};

/**
 * PUT /driver/ratings/:id/respond
 * Motorizado responde a una calificación
 */
exports.respondToRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const driverId = req.user.id;

        const rating = await Rating.findById(id);
        if (!rating) {
            return res.status(404).json({ error: 'Calificación no encontrada' });
        }

        if (rating.driver.toString() !== driverId) {
            return res.status(403).json({ error: 'No puedes responder a esta calificación' });
        }

        if (rating.driverResponse) {
            return res.status(400).json({ error: 'Ya respondiste a esta calificación' });
        }

        rating.driverResponse = response;
        rating.respondedAt = new Date();
        await rating.save();

        res.json({
            message: 'Respuesta enviada correctamente',
            rating: {
                _id: rating._id,
                driverResponse: rating.driverResponse,
                respondedAt: rating.respondedAt
            }
        });

    } catch (error) {
        console.error('Error al responder rating:', error);
        res.status(500).json({ error: 'Error al responder calificación' });
    }
};

/**
 * Genera alertas inteligentes basadas en el uso
 */
function generateAlerts(usagePercent, ridesRemaining, todayRides) {
    const alerts = [];

    // Alerta de límite alcanzado
    if (ridesRemaining === 0) {
        alerts.push({
            type: 'error',
            title: '¡Límite alcanzado!',
            message: 'Has llegado al límite de carreras de tu plan. Mejora tu plan para seguir trabajando.',
            action: 'upgrade'
        });
    }
    // Alerta de casi alcanzar límite
    else if (usagePercent >= 90) {
        alerts.push({
            type: 'warning',
            title: 'Casi en el límite',
            message: `Solo te quedan ${ridesRemaining} carreras este mes. ¡Mejora tu plan!`,
            action: 'upgrade'
        });
    }
    // Alerta de buen rendimiento
    else if (todayRides >= 10) {
        alerts.push({
            type: 'success',
            title: '¡Excelente día!',
            message: `Has completado ${todayRides} carreras hoy. ¡Sigue así!`,
            action: null
        });
    }
    // Motivación suave
    else if (usagePercent >= 50 && usagePercent < 80) {
        alerts.push({
            type: 'info',
            title: 'Vas muy bien',
            message: 'Considera mejorar tu plan para más carreras y menor comisión.',
            action: 'upgrade'
        });
    }

    return alerts;
}

module.exports = exports;
