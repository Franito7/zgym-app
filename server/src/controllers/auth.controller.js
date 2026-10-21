import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, password, phone } = req.body;
      const result = await authService.register({
        firstName,
        lastName,
        email,
        password,
        phone,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, { currentPassword, newPassword });

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },
};

