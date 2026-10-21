import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas de administración de usuarios requieren token de ADMIN
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', userController.getAll);
router.post('/', userController.create);
router.get('/:id', userController.getById);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;
