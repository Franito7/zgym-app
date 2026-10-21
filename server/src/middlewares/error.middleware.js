import { ENV } from '../config/env.js';

// Traduce errores técnicos conocidos (BD, multer, JSON) a códigos HTTP correctos
const normalizeError = (err) => {
  // Errores de Multer (subida de archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return { statusCode: 413, message: 'El archivo supera el tamaño máximo permitido (200 MB).' };
    }
    return { statusCode: 400, message: `Error en la subida del archivo: ${err.message}` };
  }
  if (typeof err.message === 'string' && err.message.startsWith('Tipo de archivo no permitido')) {
    return { statusCode: 400, message: err.message };
  }

  // Violaciones de integridad (SQLite y PostgreSQL)
  const code = String(err.code || '');
  if (code === 'SQLITE_CONSTRAINT_UNIQUE' || code === '23505') {
    return { statusCode: 409, message: 'Ya existe un registro con esos datos.' };
  }
  if (code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || code === '23503') {
    return { statusCode: 400, message: 'La operación hace referencia a un registro inexistente o en uso.' };
  }
  if (code.startsWith('SQLITE_CONSTRAINT') || code === '23514' || code === '23502') {
    return { statusCode: 400, message: 'Los datos enviados no cumplen las restricciones requeridas.' };
  }

  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'El cuerpo de la petición no es un JSON válido.' };
  }

  return { statusCode: err.statusCode || err.status || 500, message: err.message || 'Internal Server Error' };
};

export const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = normalizeError(err);

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // En producción no se exponen detalles internos de errores 500
  const safeMessage = statusCode >= 500 && ENV.NODE_ENV === 'production'
    ? 'Ocurrió un error interno. Intenta nuevamente.'
    : message;

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: safeMessage,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
