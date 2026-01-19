const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { processAndUpload } = require('../middleware/uploadMiddleware');
const {
    getProfile,
    updateProfile,
    updateProfileImage,
    getRideHistory,
    getRideDetails,
    addVehicle,
    updateVehicleImage,
    getUserVehicles,
    activateVehicle,
    deactivateVehicle,
    deleteVehicle,
    updateUserStatus,
    updateLocation
} = require('../controllers/userController');

const {
    getUserNotifications,
    markNotificationAsRead
} = require('../controllers/notificationController');

const router = express.Router();

// Rutas de perfil (requieren autenticación)
router.get('/profile', authMiddleware, getProfile);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/profile/image', authMiddleware, processAndUpload('profiles'), updateProfileImage);

// Rutas de historial de pedidos
router.get('/rides', authMiddleware, getRideHistory);
router.get('/rides/:rideId', authMiddleware, getRideDetails);

// Rutas de vehículos
router.post('/vehicles', authMiddleware, processAndUpload('vehicles'), addVehicle);
router.get('/vehicles', authMiddleware, getUserVehicles);
router.patch('/vehicles/:vehicleId/image', authMiddleware, processAndUpload('vehicles'), updateVehicleImage);
router.patch('/vehicles/:vehicleId/activate', authMiddleware, activateVehicle);
router.patch('/vehicles/:vehicleId/deactivate', authMiddleware, deactivateVehicle);
router.delete('/vehicles/:vehicleId', authMiddleware, deleteVehicle);

// Rutas de estado y ubicación
router.patch('/status', authMiddleware, updateUserStatus);
router.patch('/location', authMiddleware, updateLocation);

// Rutas de notificaciones
router.get('/notifications', authMiddleware, getUserNotifications);
router.patch('/notifications/:id/read', authMiddleware, markNotificationAsRead);

module.exports = router;