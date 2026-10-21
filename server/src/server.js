import app from './app.js';
import { ENV } from './config/env.js';
import { testConnection } from './config/db.js';

const server = app.listen(ENV.PORT, async () => {
  console.log(`[Gym Platform API] Servidor iniciado en modo ${ENV.NODE_ENV}`);
  console.log(`[Gym Platform API] Escuchando en http://localhost:${ENV.PORT}`);
  console.log(`[Gym Platform API] Health check disponible en http://localhost:${ENV.PORT}/api/health`);
  await testConnection();
});

// Manejo de apagado ordenado (graceful shutdown)
const handleShutdown = (signal) => {
  console.log(`[Gym Platform API] Recibida señal ${signal}. Cerrando servidor de forma segura...`);
  server.close(() => {
    console.log('[Gym Platform API] Servidor cerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
