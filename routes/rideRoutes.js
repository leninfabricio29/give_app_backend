const express = require('express');
const { authMiddleware, driverMiddleware } = require('../middleware/authMiddleware');
const {
    createRide,
    getRide,
    getRideTracking,
    getUserRides,
    getPendingRides,
    acceptRide,
    startRide,
    cancelRide,
    completeRide,
    rejectRide,
    markNoResponse,
    retryRide
} = require('../controllers/rideController');

const router = express.Router();

// Rutas de carreras
router.post('/rides', authMiddleware, createRide);
router.get('/rides/pending', authMiddleware, driverMiddleware, getPendingRides);
router.get('/rides/:id', authMiddleware, getRide);
router.get('/rides/:id/tracking', authMiddleware, getRideTracking);
router.get('/my-rides', authMiddleware, getUserRides);
router.put('/rides/:id/accept', authMiddleware, driverMiddleware, acceptRide);
router.put('/rides/:id/reject', authMiddleware, driverMiddleware, rejectRide);
router.put('/rides/:id/start', authMiddleware, driverMiddleware, startRide);
router.put('/rides/:id/cancel', authMiddleware, cancelRide);
router.put('/rides/:id/complete', authMiddleware, completeRide);
router.put('/rides/:id/no-response', authMiddleware, markNoResponse);
router.put('/rides/:id/retry', authMiddleware, retryRide);

module.exports = router;