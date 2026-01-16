const mongoose = require('mongoose');

// Esquema de Vehículo
const vehicleSchema = new mongoose.Schema({
    type: { type: String, enum: ['moto', 'auto', 'bicicleta'], required: true },
    plate: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    // Foto del vehículo (Cloudinary)
    vehicleImage: {
        url: { type: String, default: null },
        publicId: { type: String, default: null }
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;