const Notification = require('../models/Notification');

// Controlador para manejar notificaciones
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: req.user.id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        res.json(notification);
    } catch (error) {   
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({ error: 'Error al marcar notificación como leída' });
    }
};
