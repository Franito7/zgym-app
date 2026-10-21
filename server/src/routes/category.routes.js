import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Lectura accesible para cualquier usuario autenticado (ADMIN y ALUMNO)
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Escritura restringida exclusivamente a ADMIN
router.post('/', requireRole('ADMIN'), categoryController.create);
router.put('/:id', requireRole('ADMIN'), categoryController.update);
router.delete('/:id', requireRole('ADMIN'), categoryController.delete);

export default router;
