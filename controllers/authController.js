const authService = require('../services/authService');
// Registro de usuario
exports.registerController = async (req, res) => {
    try {
        const { email, password, fullName, role, cedula, phone } = req.body;
        
        const result = await authService.registerUser({
            email,
            password,
            fullName,
            role,
            cedula,
            phone
        });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Login de usuario
exports.loginController = async (req, res) => {
    try {
        const { email, password, fcmToken, platform } = req.body;
        
        const result = await authService.loginUser(email, password, fcmToken, platform);

        res.status(200).json({
            message: 'Login exitoso',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
