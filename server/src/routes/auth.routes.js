import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getMe);
router.put('/change-password', authenticateToken, authController.changePassword);

export default router;

