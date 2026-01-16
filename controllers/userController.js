const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Ride = require('../models/Ride');
const bcrypt = require('bcryptjs');
const { deleteFromCloudinary } = require('../middleware/uploadMiddleware');

// Obtener perfil del usuario
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

// Actualizar perfil del usuario (PATCH - múltiples campos)
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, phone, location, currentPassword, newPassword } = req.body;
        const updates = {};

        // Validaciones para cambio de email
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }
            updates.email = email;
        }

        // Validaciones para cambio de contraseña
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Se requiere la contraseña actual' });
            }
            
            const user = await User.findById(req.user.id);
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }

            updates.password = await bcrypt.hash(newPassword, 10);
        }

        // Campos simples
        if (fullName) updates.fullName = fullName;
        if (phone) updates.phone = phone;
        if (location) updates.location = location;

        // Actualizar usuario
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
};

// Actualizar foto de perfil (Cloudinary)
exports.updateProfileImage = async (req, res) => {
    try {
        if (!req.cloudinaryResult) {
            return res.status(400).json({ error: 'Debe adjuntar una imagen' });
        }

        // Obtener usuario actual para eliminar imagen anterior
        const currentUser = await User.findById(req.user.id);
        if (currentUser.profileImage?.publicId) {
            await deleteFromCloudinary(currentUser.profileImage.publicId);
        }

        // Actualizar con nueva imagen
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                profileImage: {
                    url: req.cloudinaryResult.url,
                    publicId: req.cloudinaryResult.publicId
                }
            },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            user,
            message: 'Foto de perfil actualizada'
        });
    } catch (error) {
        console.error('Error al actualizar foto de perfil:', error);
        res.status(500).json({ error: 'Error al actualizar foto de perfil' });
    }
};

// Obtener historial de pedidos del usuario
exports.getRideHistory = async (req, res) => {
    try {
        const rides = await Ride.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(rides);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial de pedidos' });
    }
};

// Registrar vehículo
exports.addVehicle = async (req, res) => {
    try {
        // Verificar que el usuario tenga rol motorizado
        const user = await User.findById(req.user.id);
        if (user.role !== 'motorizado') {
            return res.status(403).json({ error: 'Solo usuarios motorizados pueden registrar vehículos' });
        }

        const { type, plate } = req.body;
        
        // Verificar límite de vehículos según plan
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('plan');

        if (!subscription) {
            return res.status(403).json({ error: 'Necesitas una suscripción activa para registrar vehículos' });
        }

        const currentVehicles = await Vehicle.countDocuments({ owner: req.user.id, status: 'active' });
        const maxVehicles = subscription.plan?.maxVehicles || 1;

        if (currentVehicles >= maxVehicles) {
            return res.status(400).json({ 
                error: `Tu plan permite máximo ${maxVehicles} vehículo(s). Actualiza tu plan para agregar más.` 
            });
        }

        // Preparar datos del vehículo
        const vehicleData = {
            type,
            plate,
            owner: req.user.id
        };

        // Si viene imagen de Cloudinary
        if (req.cloudinaryResult) {
            vehicleData.vehicleImage = {
                url: req.cloudinaryResult.url,
                publicId: req.cloudinaryResult.publicId
            };
        }
        
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        
        res.status(201).json({
            success: true,
            vehicle,
            message: 'Vehículo registrado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Error al registrar vehículo' });
    }
};

// Actualizar imagen del vehículo (Cloudinary)
exports.updateVehicleImage = async (req, res) => {
    try {
        const { vehicleId } = req.params;

        if (!req.cloudinaryResult) {
            return res.status(400).json({ error: 'Debe adjuntar una imagen' });
        }

        // Verificar que el vehículo pertenezca al usuario
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user.id });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }

        // Eliminar imagen anterior de Cloudinary si existe
        if (vehicle.vehicleImage?.publicId) {
            await deleteFromCloudinary(vehicle.vehicleImage.publicId);
        }

        // Actualizar con nueva imagen
        vehicle.vehicleImage = {
            url: req.cloudinaryResult.url,
            publicId: req.cloudinaryResult.publicId
        };
        await vehicle.save();

        res.json({
            success: true,
            vehicle,
            message: 'Imagen del vehículo actualizada'
        });
    } catch (error) {
        console.error('Error al actualizar imagen del vehículo:', error);
        res.status(500).json({ error: 'Error al actualizar imagen del vehículo' });
    }
};

// Obtener vehículos del usuario
exports.getUserVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ owner: req.user.id }).sort({ createdAt: 1 });
        
        // Obtener info de suscripción para saber el límite
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('plan');
        
        const maxVehicles = subscription?.plan?.maxVehicles || 1;
        const activeCount = vehicles.filter(v => v.status === 'active').length;
        
        res.json({
            vehicles,
            limits: {
                max: maxVehicles,
                active: activeCount,
                canActivateMore: activeCount < maxVehicles
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
};

// Activar un vehículo
exports.activateVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        // Verificar que el vehículo pertenezca al usuario
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user.id });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        if (vehicle.status === 'active') {
            return res.status(400).json({ error: 'El vehículo ya está activo' });
        }
        
        // Verificar límite del plan
        const Subscription = require('../models/Subscription');
        const subscription = await Subscription.findOne({
            user: req.user.id,
            status: 'active'
        }).populate('plan');
        
        if (!subscription) {
            return res.status(403).json({ error: 'Necesitas una suscripción activa' });
        }
        
        const maxVehicles = subscription.plan?.maxVehicles || 1;
        const activeCount = await Vehicle.countDocuments({ owner: req.user.id, status: 'active' });
        
        if (activeCount >= maxVehicles) {
            return res.status(400).json({ 
                error: `Tu plan permite máximo ${maxVehicles} vehículo(s) activo(s). Desactiva otro primero o actualiza tu plan.`,
                code: 'LIMIT_REACHED'
            });
        }
        
        vehicle.status = 'active';
        await vehicle.save();
        
        res.json({
            success: true,
            vehicle,
            message: 'Vehículo activado'
        });
    } catch (error) {
        console.error('Error al activar vehículo:', error);
        res.status(500).json({ error: 'Error al activar vehículo' });
    }
};

// Desactivar un vehículo
exports.deactivateVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        // Verificar que el vehículo pertenezca al usuario
        const vehicle = await Vehicle.findOne({ _id: vehicleId, owner: req.user.id });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        if (vehicle.status === 'inactive') {
            return res.status(400).json({ error: 'El vehículo ya está inactivo' });
        }
        
        vehicle.status = 'inactive';
        await vehicle.save();
        
        res.json({
            success: true,
            vehicle,
            message: 'Vehículo desactivado'
        });
    } catch (error) {
        console.error('Error al desactivar vehículo:', error);
        res.status(500).json({ error: 'Error al desactivar vehículo' });
    }
};

// Eliminar un vehículo
exports.deleteVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        const vehicle = await Vehicle.findOneAndDelete({ _id: vehicleId, owner: req.user.id });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
        
        // Eliminar imagen de Cloudinary si existe
        if (vehicle.vehicleImage?.publicId) {
            const { deleteFromCloudinary } = require('../middleware/uploadMiddleware');
            await deleteFromCloudinary(vehicle.vehicleImage.publicId);
        }
        
        res.json({
            success: true,
            message: 'Vehículo eliminado'
        });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({ error: 'Error al eliminar vehículo' });
    }
};

// Obtener detalles de un pedido específico
exports.getRideDetails = async (req, res) => {
    try {
        const { rideId } = req.params;
        const ride = await Ride.findById(rideId);
        
        if (!ride) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        // Verificar que el usuario sea el dueño del pedido
        if (ride.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        res.json(ride);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalles del pedido' });
    }
};

// Actualizar estado del usuario (en línea/fuera de línea)
exports.updateUserStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isOnline },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
};

// Actualizar ubicación del usuario
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                location: {
                    latitude,
                    longitude,
                    address
                }
            },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar ubicación' });
    }
};
