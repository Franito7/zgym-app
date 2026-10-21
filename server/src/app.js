import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir archivos multimedia locales subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares globales de seguridad y parseo
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas principales de la API
app.use('/api', apiRouter);

// Manejador para rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejo centralizado de errores
app.use(errorHandler);

export default app;
