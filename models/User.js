const mongoose = require('mongoose');

// Esquema de Usuario
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cedula: { type: String, required: true, unique: true },
    phone: { type: String },
    // Foto de perfil (Cloudinary)
    profileImage: {
        url: { type: String, default: null },
        publicId: { type: String, default: null }
    },
    role: { type: String, enum: ['admin', 'motorizado', 'cliente'], required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: String
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;