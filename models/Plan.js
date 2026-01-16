const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },

  description: String,

  price: {
    type: Number,
    required: true // 0 = freemium
  },

  billingCycle: {
    type: String,
    enum: ['monthly'],
    default: 'monthly'
  },

  maxRidesPerMonth: {
    type: Number,
    required: true // ej: 20 en freemium
  },

  maxVehicles: {
    type: Number,
    required: true
  },

  commissionPercent: {
    type: Number,
    required: true // % que se queda la plataforma
  },

  priority: {
    type: Boolean,
    default: false
  },

  perks: [String],

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
