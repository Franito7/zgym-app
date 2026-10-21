import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authenticateToken);
router.get('/', requireRole('ADMIN', 'ENTRENADOR'), dashboardController.getCoachDashboard);

export default router;
