const mongoose = require('mongoose');

// Esquema de Pago de Suscripción
const paymentSchema = new mongoose.Schema({
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['transfer', 'cash', 'wallet', 'card'], default: 'transfer' },
    status: { type: String, enum: ['pending', 'verifying', 'approved', 'rejected'], default: 'pending' },
    // Período que cubre este pago
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    // Comprobante de pago (imagen en Cloudinary)
    paymentProof: {
        image: String, // URL de Cloudinary
        publicId: String, // Public ID para eliminar de Cloudinary si es necesario
        uploadedAt: Date
    },
    // Verificación por admin
    verification: {
        verifiedAt: Date,
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rejectionReason: String
    },
    notes: String,
    referenceCode: String // Código de referencia generado
}, { timestamps: true });

// Generar código de referencia único
paymentSchema.pre('save', function(next) {
    if (!this.referenceCode) {
        this.referenceCode = 'PAY-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    next();
});

// Índices
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;