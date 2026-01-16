const authService = require('../services/authService');

// Middleware de autenticación JWT
exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = authService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'No autorizado' });
    }
};

// Middleware para verificar roles específicos
exports.roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }
        next();
    };
};

// Middleware para admin
exports.adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administrador' });
    }
    next();
};

// Middleware para motorizado
exports.driverMiddleware = (req, res, next) => {
    if (req.user.role !== 'motorizado') {
        return res.status(403).json({ error: 'Solo para conductores' });
    }
    next();
};
