const express = require('express');
const { registerController, loginController } = require('../controllers/authController');

const router = express.Router();

// Rutas de autenticación
router.post('/register', registerController);
router.post('/login', loginController);

module.exports = router;