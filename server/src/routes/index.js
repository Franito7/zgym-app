import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import exerciseRoutes from './exercise.routes.js';
import mediaRoutes from './media.routes.js';
import routineRoutes from './routine.routes.js';
import releaseRoutes from './release.routes.js';
import calendarRoutes from './calendar.routes.js';
import paymentRoutes from './payment.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const apiRouter = Router();

// Montaje de rutas base y administrativas
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/exercises', exerciseRoutes);
apiRouter.use('/media', mediaRoutes);
apiRouter.use('/routines', routineRoutes);
apiRouter.use('/content', releaseRoutes);
apiRouter.use('/releases', releaseRoutes);
apiRouter.use('/calendar', calendarRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;
