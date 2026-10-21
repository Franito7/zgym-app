import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Todas las rutas de media requieren autenticación
router.use(authenticateToken);

// El catálogo completo es exclusivo del ADMIN.
// Los alumnos acceden solo a lo liberado mediante /api/content/my-content.
router.get('/', requireRole('ADMIN'), mediaController.getAll);
router.get('/:id', requireRole('ADMIN'), mediaController.getById);

// Subida física de archivos (Videos / PDFs) exclusiva para ADMIN
router.post('/upload', requireRole('ADMIN'), upload.single('file'), mediaController.uploadFile);

// Registro en base de datos, modificación y eliminación exclusiva para ADMIN
router.post('/', requireRole('ADMIN'), mediaController.create);
router.put('/:id', requireRole('ADMIN'), mediaController.update);
router.delete('/:id', requireRole('ADMIN'), mediaController.delete);

export default router;
