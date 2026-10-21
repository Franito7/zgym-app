import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

// Solo el entrenador o administrador puede gestionar pagos
router.get('/', requireRole('ADMIN', 'ENTRENADOR'), paymentController.getAll);
router.post('/', requireRole('ADMIN', 'ENTRENADOR'), paymentController.create);
router.get('/:id', requireRole('ADMIN', 'ENTRENADOR'), paymentController.getById);
router.delete('/:id', requireRole('ADMIN', 'ENTRENADOR'), paymentController.delete);

export default router;
