// Validaciones básicas para datos de entrada
const validateRegister = (data) => {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
        errors.push('Name is required');
    }

    if (!data.cedula || data.cedula.trim() === '') {
        errors.push('Cedula is required');
    }

    if (!data.email || !data.email.includes('@')) {
        errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (!['admin', 'motorizado', 'cliente'].includes(data.role)) {
        errors.push('Invalid role');
    }

    return errors;
};

const validateLogin = (data) => {
    const errors = [];

    if (!data.identifier || data.identifier.trim() === '') {
        errors.push('Email or cedula is required');
    }

    if (!data.password || data.password.trim() === '') {
        errors.push('Password is required');
    }

    return errors;
};

const validateRide = (data) => {
    const errors = [];

    if (!data.description || data.description.trim() === '') {
        errors.push('Description is required');
    }

    if (!data.pickup || !data.pickup.lat || !data.pickup.lng) {
        errors.push('Pickup location is required with lat and lng');
    }

    if (!data.dropoff || !data.dropoff.lat || !data.dropoff.lng) {
        errors.push('Dropoff location is required with lat and lng');
    }

    return errors;
};

const validateVehicle = (data) => {
    const errors = [];

    if (!['moto', 'auto', 'bicicleta'].includes(data.type)) {
        errors.push('Invalid vehicle type');
    }

    if (!data.plate || data.plate.trim() === '') {
        errors.push('Plate is required');
    }

    return errors;
};

const validatePlan = (data) => {
    const errors = [];

    if (!data.name || data.name.trim() === '') {
        errors.push('Plan name is required');
    }

    if (!data.price || data.price <= 0) {
        errors.push('Valid price is required');
    }

    if (!data.maxVehicles || data.maxVehicles <= 0) {
        errors.push('Max vehicles must be greater than 0');
    }

    if (!data.commission || data.commission < 0 || data.commission > 100) {
        errors.push('Commission must be between 0 and 100');
    }

    return errors;
};

module.exports = {
    validateRegister,
    validateLogin,
    validateRide,
    validateVehicle,
    validatePlan
};