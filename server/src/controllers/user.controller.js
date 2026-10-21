import { userService } from '../services/user.service.js';

export const userController = {
  async getAll(req, res, next) {
    try {
      const { role, isActive, trainerId, search, status, type } = req.query;
      const filters = {
        role,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        trainerId,
        search,
        status,
        type,
      };
      const users = await userService.getAllUsers(filters);
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const newUser = await userService.createUserByAdmin(req.body);
      res.status(201).json({
        success: true,
        message: 'Cliente registrado exitosamente.',
        data: { user: newUser },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedUser = await userService.updateUser(id, req.body, req.user?.id);
      res.status(200).json({
        success: true,
        message: 'Cliente actualizado exitosamente.',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id, req.user?.id);
      res.status(200).json({
        success: true,
        message: 'Cliente eliminado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },
};
