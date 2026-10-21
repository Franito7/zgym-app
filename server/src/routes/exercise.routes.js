import { Router } from 'express';
import { exerciseController } from '../controllers/exercise.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas requieren token
router.use(authenticateToken);

// Consulta disponible para cualquier usuario autenticado (ADMIN y ALUMNO)
router.get('/', exerciseController.getAll);
router.get('/:id', exerciseController.getById);

// Creación, edición y borrado restringidos exclusivamente a ADMIN
router.post('/', requireRole('ADMIN'), exerciseController.create);
router.put('/:id', requireRole('ADMIN'), exerciseController.update);
router.delete('/:id', requireRole('ADMIN'), exerciseController.delete);

export default router;
