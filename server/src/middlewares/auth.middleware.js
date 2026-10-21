import { verifyToken } from '../utils/jwt.util.js';
import { userRepository } from '../repositories/user.repository.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Acceso no autorizado: No se proporcionó token de autenticación.',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Acceso no autorizado: Token inválido o expirado.',
    });
  }

  try {
    // Validar contra la base de datos: el usuario debe seguir existiendo y estar activo.
    // Esto revoca el acceso de cuentas eliminadas/desactivadas y aplica cambios de rol al instante.
    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Acceso no autorizado: La cuenta no existe o fue desactivada.',
      });
    }

    req.user = { ...decoded, id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};
