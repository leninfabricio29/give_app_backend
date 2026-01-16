const express = require('express');
const { authMiddleware, driverMiddleware } = require('../middleware/authMiddleware');
const {
    getHomeSummary,
    getEarnings,
    getMyRatings,
    createRating,
    respondToRating
} = require('../controllers/driverController');

const router = express.Router();

// Rutas del motorizado (requieren auth + rol motorizado)
router.get('/driver/home-summary', authMiddleware, driverMiddleware, getHomeSummary);
router.get('/driver/earnings', authMiddleware, driverMiddleware, getEarnings);
router.get('/driver/ratings', authMiddleware, driverMiddleware, getMyRatings);
router.put('/driver/ratings/:id/respond', authMiddleware, driverMiddleware, respondToRating);

// Ruta de calificación (cualquier usuario autenticado puede calificar)
router.post('/ratings', authMiddleware, createRating);

module.exports = router;
