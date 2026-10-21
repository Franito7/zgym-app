import { Router } from 'express';
import { releaseController } from '../controllers/release.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);

// Consulta de videos o PDFs liberados para el alumno en sesión
router.get('/my-content', releaseController.getMyContent);

// Endpoints de administración de liberaciones (Solo ADMIN)
router.get('/', requireRole('ADMIN'), releaseController.getAll);
router.post('/', requireRole('ADMIN'), releaseController.create);
router.get('/releases', requireRole('ADMIN'), releaseController.getAll);
router.post('/releases', requireRole('ADMIN'), releaseController.create);
router.delete('/releases/:id', requireRole('ADMIN'), releaseController.delete);
router.delete('/:id', requireRole('ADMIN'), releaseController.delete);

export default router;
