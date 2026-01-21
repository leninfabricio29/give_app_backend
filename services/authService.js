const User = require('../models/User');
const Subscription = require('../models/Subscription');
const FcmDevice = require('../models/FcmDevice');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registrar usuario
exports.registerUser = async (userData) => {
    try {
        const { email, password, fullName, role, cedula, phone, fcmToken, platform } = userData;

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('El email ya está registrado');
        }

        // Hash de contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            fullName,
            role: role || 'cliente',
            cedula,
            phone
        });

        await user.save();

        // Generar token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Crear registro de FCM Device si se proporciona token
        if (fcmToken) {
            let fcmDevice = await FcmDevice.findOne({ deviceToken: fcmToken });
            if (fcmDevice) {
                fcmDevice.user = user._id;
                fcmDevice.platform = platform;
                await fcmDevice.save();
            } else {
                fcmDevice = new FcmDevice({
                    user: user._id,
                    deviceToken: fcmToken,
                    platform,
                    lastLoginAt: new Date(),
                    isActive: true
                });
                await fcmDevice.save();
            }
        }

        // Devolver todos los datos del usuario
        return {
            token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                cedula: user.cedula,
                phone: user.phone,
                profileImage: user.profileImage,
                status: user.status,
                isOnline: user.isOnline,
                rating: user.rating
            }
        };
    } catch (error) {
        throw error;
    }
};

// Login de usuario
exports.loginUser = async (email, password, fcmToken, platform) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Contraseña incorrecta');
        }

        // Generar token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Preparar datos del usuario
        const userData = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            cedula: user.cedula,
            phone: user.phone,
            profileImage: user.profileImage,
            status: user.status,
            isOnline: user.isOnline,
            rating: user.rating,
            points: user.points
        };

        // Si es motorista, obtener su suscripción
        if (user.role === 'motorizado') {
            const subscription = await Subscription.findOne({
                user: user._id,
                status: 'active'
            }).populate('plan');

            if (subscription) {
                userData.subscription = {
                    id: subscription._id,
                    plan: subscription.plan,
                    status: subscription.status,
                    startDate: subscription.startDate
                };
            }
        }

        //console.log('User logged in:', userData);

        //Crear registro de FCM Device si no existe
        const fcmDevice = await FcmDevice.findOne({ deviceToken: fcmToken });
        if (fcmDevice) {
            fcmDevice.user = user._id;
            fcmDevice.platform = platform;
            fcmDevice.lastLoginAt = new Date();
            fcmDevice.isActive = true;
            await fcmDevice.save();
        } else {
            fcmDevice = new FcmDevice({
                user: user._id,
                deviceToken: fcmToken,
                platform,
                lastLoginAt: new Date(),
                isActive: true
            });
            await fcmDevice.save();
        }

        // Devolver todos los datos del usuario
        return {
            token,
            user: userData
        };
    } catch (error) {
        throw error;
    }
};

// Verificar y decodificar token
exports.verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return decoded;
    } catch (error) {
        throw new Error('Token inválido o expirado');
    }
};
