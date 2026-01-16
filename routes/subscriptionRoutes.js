const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { processAndUpload } = require('../middleware/uploadMiddleware');
const {
    createPlan,
    getPlans,
    subscribePlan,
    getUserSubscription,
    uploadPaymentProof,
    getMyPayments,
    verifyPayment,
    getPendingPayments,
    getPayments,
    checkSubscriptionStatus
} = require('../controllers/subscriptionController');

const router = express.Router();

// Rutas de planes (admin)
router.post('/plans', createPlan);
router.get('/plans', getPlans);

// Rutas de suscripciones
router.post('/subscribe', authMiddleware, subscribePlan);
router.get('/my-subscription', authMiddleware, getUserSubscription);
router.get('/status', authMiddleware, checkSubscriptionStatus);

// Rutas de pagos (motorizado) - con middleware de Cloudinary
router.post('/payments/upload', authMiddleware, processAndUpload('payments'), uploadPaymentProof);
router.get('/payments/my-payments', authMiddleware, getMyPayments);

// Rutas de pagos (admin)
router.get('/payments/pending', authMiddleware, adminMiddleware, getPendingPayments);
router.get('/payments', authMiddleware, adminMiddleware, getPayments);
router.put('/payments/:paymentId/verify',  verifyPayment);

module.exports = router;