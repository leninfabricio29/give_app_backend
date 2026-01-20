const mongoose = require('mongoose');

// Esquema de Suscripción del Usuario
const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'inactive', 'expired', 'pending'], default: 'active' },
    renewalDate: { type: Date },
    autoRenew: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;