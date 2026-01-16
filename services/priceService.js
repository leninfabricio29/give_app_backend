// Calcular distancia usando fórmula de Haversine
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
};

// Calcular precio del viaje
exports.calculatePrice = (distanceKm) => {
    const baseFare = 1.50; // USD
    const perKmRate = 0.50; // USD por km
    const calculatedPrice = distanceKm * perKmRate;
    return Math.max(baseFare, calculatedPrice);
};
