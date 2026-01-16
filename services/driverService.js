const User = require('../models/User');
const Subscription = require('../models/Subscription');
const priceService = require('./priceService');

// Buscar conductores cercanos
exports.findNearbyDrivers = async (clientLat, clientLon, radius = 5) => {
    try {
        // Obtener todos los conductores en línea
        const drivers = await User.find({
            role: 'motorizado',
            isOnline: true,
            location: { $exists: true }
        });

        // Verificar suscripciones activas
        const activeDrivers = [];
        for (let driver of drivers) {
            const subscription = await Subscription.findOne({
                user: driver._id,
                status: 'active'
            });

            if (subscription) {
                // Calcular distancia
                const distance = priceService.calculateDistance(
                    clientLat,
                    clientLon,
                    driver.location.latitude,
                    driver.location.longitude
                );

                if (distance <= radius) {
                    activeDrivers.push({
                        id: driver._id,
                        name: driver.fullName,
                        distance: distance.toFixed(2),
                        rating: driver.rating || 5
                    });
                }
            }
        }

        // Ordenar por distancia (más cercanos primero)
        return activeDrivers.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } catch (error) {
        throw error;
    }
};
