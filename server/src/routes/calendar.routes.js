import { Router } from 'express';
import { calendarController } from '../controllers/calendar.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

// Todas las rutas de calendario requieren autenticación
router.use(authenticateToken);

// Consulta de eventos personales del alumno
router.get('/my-events', calendarController.getMyEvents);

// Actualización de estado del evento (Alumno o Admin)
router.patch('/events/:id/status', calendarController.updateStatus);

// Endpoints de administración de calendario (Solo ADMIN)
router.get('/', requireRole('ADMIN'), calendarController.getAllEvents);
router.post('/', requireRole('ADMIN'), calendarController.create);
router.get('/events', requireRole('ADMIN'), calendarController.getAllEvents);
router.post('/events', requireRole('ADMIN'), calendarController.create);
router.put('/events/:id', requireRole('ADMIN'), calendarController.update);
router.delete('/events/:id', requireRole('ADMIN'), calendarController.delete);
router.put('/:id', requireRole('ADMIN'), calendarController.update);
router.delete('/:id', requireRole('ADMIN'), calendarController.delete);

export default router;
