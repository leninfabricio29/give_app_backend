const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// Función auxiliar para ajustar vehículos según el plan
const adjustVehiclesForPlan = async (userId, maxVehicles) => {
    const activeVehicles = await Vehicle.find({ owner: userId, status: 'active' })
        .sort({ createdAt: 1 }); // Los más antiguos primero

    if (activeVehicles.length > maxVehicles) {
        // Desactivar los vehículos más recientes que excedan el límite
        const vehiclesToDeactivate = activeVehicles.slice(maxVehicles);

        await Vehicle.updateMany(
            { _id: { $in: vehiclesToDeactivate.map(v => v._id) } },
            { status: 'inactive' }
        );

        return {
            adjusted: true,
            deactivated: vehiclesToDeactivate.length,
            message: `Se desactivaron ${vehiclesToDeactivate.length} vehículo(s) por límite del plan`
        };
    }

    return { adjusted: false };
};

// Crear plan (solo admin)
exports.createPlan = async (req, res) => {
    try {
        const { name, description, price, maxRidesPerMonth, maxVehicles, commissionPercent, priority, perks } = req.body;

        // Validar campos requeridos
        if (!name || price === undefined || !maxRidesPerMonth || !maxVehicles || commissionPercent === undefined) {
            return res.status(400).json({
                error: 'Campos requeridos faltantes: name, price, maxRidesPerMonth, maxVehicles, commissionPercent'
            });
        }

        const plan = new Plan({
            name,
            description,
            price,
            maxRidesPerMonth,
            maxVehicles,
            commissionPercent,
            priority: priority || false,
            perks: perks || [],
            status: 'active'
        });

        await plan.save();
        res.status(201).json(plan);
    } catch (error) {
        console.error('Error al crear plan:', error);
        res.status(400).json({ error: error.message || 'Error al crear plan' });
    }
};

// Obtener planes disponibles
exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ status: 'active' });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener planes' });
    }
};

// Suscribir a un plan (crear o cambiar de plan)
exports.subscribePlan = async (req, res) => {
    try {
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ error: 'El ID del plan es requerido' });
        }

        // Verificar que el plan existe
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }

        if (plan.status !== 'active') {
            return res.status(400).json({ error: 'Este plan no está disponible' });
        }

        // Buscar suscripción existente
        let subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        });

        let vehicleAdjustment = null;

        if (subscription) {
            // Si ya tiene suscripción, actualizar a nuevo plan
            subscription.plan = planId;
            subscription.startDate = new Date();
            subscription.endDate = null;

            // Ajustar vehículos si el nuevo plan tiene menos límite
            vehicleAdjustment = await adjustVehiclesForPlan(req.user.id, plan.maxVehicles);
        } else {
            //Calcular fecha de finalización (30 días desde hoy)
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);
            // Crear nueva suscripción
            subscription = new Subscription({
                user: req.user.id,
                plan: planId,
                status: 'active',
                startDate: new Date(),
                endDate: endDate
            });
        }

        await subscription.save();

        // Retornar con los datos del plan
        const populatedSubscription = await subscription.populate('plan');

        res.status(201).json({
            message: 'Suscripción exitosa',
            subscription: populatedSubscription,
            vehicleAdjustment
        });
    } catch (error) {
        console.error('Error al crear suscripción:', error);
        res.status(400).json({ error: error.message || 'Error al crear suscripción' });
    }
};

// Obtener suscripción del usuario con estadísticas de carreras
exports.getUserSubscription = async (req, res) => {
    try {
        const Ride = require('../models/Ride');

        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('plan');

        if (!subscription) {
            return res.status(404).json({
                error: 'Sin suscripción activa',
                hasSubscription: false
            });
        }

        // Calcular inicio del mes actual
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Contar carreras completadas este mes
        const ridesThisMonth = await Ride.countDocuments({
            driver: req.user.id,
            status: { $in: ['completed', 'in_progress', 'accepted'] },
            createdAt: { $gte: monthStart, $lte: monthEnd }
        });

        const remainingRides = Math.max(0, subscription.plan.maxRidesPerMonth - ridesThisMonth);

        res.json({
            subscription,
            hasSubscription: true,
            ridesThisMonth,
            remainingRides,
            maxRidesPerMonth: subscription.plan.maxRidesPerMonth
        });
    } catch (error) {
        console.error('Error al obtener suscripción:', error);
        res.status(500).json({ error: 'Error al obtener suscripción' });
    }
};

// Cancelar suscripción
exports.cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findByIdAndUpdate(
            req.params.subscriptionId,
            { status: 'inactive' },
            { new: true }
        );

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ error: 'Error al cancelar suscripción' });
    }
};

// Subir comprobante de pago de suscripción
exports.uploadPaymentProof = async (req, res) => {
    try {
        const { paymentMethod, notes } = req.body;

        // Verificar que se procesó la imagen (viene de Cloudinary via middleware)
        if (!req.cloudinaryResult) {
            return res.status(400).json({ error: 'Debe adjuntar imagen del comprobante' });
        }

        // Obtener suscripción activa del usuario
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: { $in: ['active', 'inactive'] }
        }).populate('plan');

        if (!subscription) {
            return res.status(404).json({ error: 'No tienes una suscripción. Primero elige un plan.' });
        }

        // Calcular período del pago (mes actual o próximo si ya pagó este mes)
        const now = new Date();
        let periodStart = new Date(now);

        // Fin: +1 mes (misma fecha)
        let periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Verificar si ya existe un pago aprobado para este período
        const existingApprovedPayment = await Payment.findOne({
            subscription: subscription._id,
            status: 'approved',
            periodStart: { $gte: periodStart },
            periodEnd: { $lte: periodEnd }
        });

        if (existingApprovedPayment) {
            // Si ya pagó este mes, el pago es para el próximo mes
            periodStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        }

        // Verificar si ya hay un pago pendiente/verificando para este período
        const pendingPayment = await Payment.findOne({
            subscription: subscription._id,
            status: { $in: ['pending', 'verifying'] },
            periodStart: { $gte: periodStart }
        });

        if (pendingPayment) {
            return res.status(400).json({
                error: 'Ya tienes un pago pendiente de verificación. Espera a que sea procesado.'
            });
        }

        const payment = new Payment({
            subscription: subscription._id,
            user: req.user.id,
            plan: subscription.plan._id,
            amount: subscription.plan.price,
            paymentMethod: paymentMethod || 'transfer',
            status: 'verifying',
            periodStart,
            periodEnd,
            paymentProof: {
                image: req.cloudinaryResult.url,
                publicId: req.cloudinaryResult.publicId,
                uploadedAt: new Date()
            },
            notes
        });

        await payment.save();

        //Captura la suscripción para posibles 

        subscription.status = 'pending';
        await subscription.save();

        res.status(201).json({
            success: true,
            payment: await payment.populate(['plan', 'subscription']),
            message: 'Comprobante enviado. Será verificado en las próximas horas.'
        });
    } catch (error) {
        console.error('Error upload payment proof:', error);
        res.status(400).json({ error: 'Error al subir comprobante' });
    }
};

// Obtener historial de pagos del usuario
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id })
            .populate('plan', 'name price')
            .populate('subscription')
            .sort({ createdAt: -1 });

        // Calcular totales
        const totalPaid = payments
            .filter(p => p.status === 'approved')
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayments = payments.filter(p => ['pending', 'verifying'].includes(p.status));

        res.json({
            payments,
            summary: {
                total: payments.length,
                approved: payments.filter(p => p.status === 'approved').length,
                pending: pendingPayments.length,
                rejected: payments.filter(p => p.status === 'rejected').length,
                totalPaid
            }
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ error: 'Error al obtener historial de pagos' });
    }
};

// Verificar pago (solo admin)
exports.verifyPayment = async (req, res) => {
    try {


        const { paymentId } = req.params;
        const { approved, rejectionReason } = req.body;

        const payment = await Payment.findById(paymentId).populate('subscription');

        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        if (approved) {
            payment.status = 'approved';
            payment.verification = {
                verifiedAt: new Date(),
                verifiedBy: req.user?.id || null
            };

            // Activar/renovar la suscripción
             await Subscription.findByIdAndUpdate(payment.subscription._id, {
                status: 'active',
                startDate: payment.periodStart,
                endDate: payment.periodEnd,
                renewalDate: payment.periodEnd
            });
        } else {
            payment.status = 'rejected';
            payment.verification = {
                verifiedAt: new Date(),
                verifiedBy: req.user?.id || null,
                rejectionReason: rejectionReason || 'Comprobante inválido'
            };
        }

        await payment.save();

        const notification = new Notification({
            user: payment.user,
            title: approved ? 'Pago aprobado' : 'Pago rechazado',
            message: approved
            ? 'Tu pago ha sido aceptado. ¡Tu suscripción está activa!'
            : 'Tu pago ha sido rechazado. Por favor, revisa el comprobante y vuelve a intentarlo.',
            relatedPayment: payment._id
        });
        await notification.save();

        //emitir socket de nueva notificación si el motorizado está online
        const { io } = require('../server');

        io.emit('new_notification', {
            rider: payment.user.toString(),
        });

        res.json({
            success: true,
            payment: await payment.populate(['user', 'plan']),
            message: approved ? 'Pago aprobado. Suscripción activada.' : 'Pago rechazado.'
        });
    } catch (error) {
        console.error('Error verify payment:', error);
        res.status(500).json({ error: 'Error al verificar pago' });
    }
};

// Obtener pagos pendientes de verificación (solo admin)
exports.getPendingPayments = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const payments = await Payment.find({ status: 'verifying' })
            .populate('user', 'fullName email phone')
            .populate('plan', 'name price')
            .populate('subscription')
            .sort({ createdAt: 1 }); // Más antiguos primero

        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pagos pendientes' });
    }
};

// Obtener todos los pagos (solo admin)
exports.getPayments = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { status, userId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (userId) filter.user = userId;

        const payments = await Payment.find(filter)
            .populate('user', 'fullName email phone')
            .populate('plan', 'name price')
            .populate('subscription')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pagos' });
    }
};
// Verificar si el usuario necesita suscribirse a un plan
exports.checkSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({
            user: req.user.id,
            //status: 'active'
        }).populate('plan');

        if (!subscription) {
            return res.json({
                hasSubscription: false,
                message: 'No tienes un plan activo. Debes elegir uno para continuar.'
            });
        }

        // Si tiene suscripción, retornar sus datos
        res.json({
            hasSubscription: true,
            subscription
        });
    } catch (error) {
        console.error('Error al verificar suscripción:', error);
        res.status(500).json({ error: 'Error al verificar suscripción' });
    }
};



