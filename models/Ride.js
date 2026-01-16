const mongoose = require('mongoose');

// Esquema de Viaje
const rideSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String },
    pickupLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: String
    },
    dropoffLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: String
    },
    distance: { type: Number, default: 0 },
    price: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_response'], 
        default: 'pending' 
    },
    // Array de motorizados que rechazaron esta carrera (no les aparecerá de nuevo)
    rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rating: { type: Number, min: 1, max: 5 },
    // Tiempo límite de espera (en segundos)
    searchTimeout: { type: Number, default: 120 },
    // Timestamps de estados
    acceptedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    // Vehículo usado (referencia)
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;