const mongoose = require('mongoose');
// Esquema de Notificación

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedRide: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);