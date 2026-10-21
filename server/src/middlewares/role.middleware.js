export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'No autenticado: Se requiere inicio de sesión.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: `Acceso denegado: Se requiere uno de los siguientes roles: [${allowedRoles.join(', ')}].`,
      });
    }

    next();
  };
};
