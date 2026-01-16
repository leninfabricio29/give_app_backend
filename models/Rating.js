const mongoose = require('mongoose');

// Esquema de Calificación
const ratingSchema = new mongoose.Schema({
    // Carrera asociada
    ride: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Ride', 
        required: true 
    },
    
    // Cliente que califica
    client: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Motorizado calificado
    driver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // Calificación de 1 a 5 estrellas
    rating: { 
        type: Number, 
        required: true,
        min: 1, 
        max: 5 
    },
    
    // Comentario opcional
    comment: { 
        type: String,
        maxlength: 500
    },
    
    // Tags predefinidos (opcional)
    tags: [{
        type: String,
        enum: [
            'puntual', 'amable', 'profesional', 'cuidadoso', 'rapido', 'comunicativo',
            'Puntual', 'Amable', 'Seguro', 'Profesional', 'Limpio',
            'Tardanza', 'Conducción insegura', 'Mal trato', 'Mala comunicación'
        ]
    }],
    
    // Si fue respondida por el motorizado
    driverResponse: {
        type: String,
        maxlength: 200
    },
    
    respondedAt: Date
    
}, { timestamps: true });

// Índices para consultas rápidas
ratingSchema.index({ driver: 1, createdAt: -1 });
ratingSchema.index({ ride: 1 }, { unique: true }); // Solo 1 rating por carrera

// Método estático para calcular promedio de un motorizado
ratingSchema.statics.getDriverAverageRating = async function(driverId) {
    const result = await this.aggregate([
        { $match: { driver: new mongoose.Types.ObjectId(driverId) } },
        { 
            $group: { 
                _id: '$driver',
                averageRating: { $avg: '$rating' },
                totalRatings: { $sum: 1 }
            } 
        }
    ]);
    
    if (result.length === 0) {
        return { averageRating: 5, totalRatings: 0 };
    }
    
    return {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalRatings: result[0].totalRatings
    };
};

// Método estático para obtener distribución de ratings
ratingSchema.statics.getDriverRatingDistribution = async function(driverId) {
    const result = await this.aggregate([
        { $match: { driver: new mongoose.Types.ObjectId(driverId) } },
        { 
            $group: { 
                _id: '$rating',
                count: { $sum: 1 }
            } 
        },
        { $sort: { _id: -1 } }
    ]);
    
    // Crear objeto con todos los ratings (1-5)
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result.forEach(r => {
        distribution[r._id] = r.count;
    });
    
    return distribution;
};

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
