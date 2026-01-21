const mongoose = require('mongoose');
// Esquema de Dispositivo FCM
const fcmDeviceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceToken: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['android', 'ios'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('FcmDevice', fcmDeviceSchema);