import { Router } from 'express';
import { routineController } from '../controllers/routine.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

// Rutinas liberadas del alumno en sesión
router.get('/my-routines', routineController.getMyRoutines);

// Gestión de rutinas para administradores
router.get('/', requireRole('ADMIN'), routineController.getAll);
router.post('/', requireRole('ADMIN'), routineController.create);
router.put('/:id', requireRole('ADMIN'), routineController.update);
router.delete('/:id', requireRole('ADMIN'), routineController.delete);

// Consulta de detalle (validado en servicio si es alumno o admin)
router.get('/:id', routineController.getById);

export default router;
