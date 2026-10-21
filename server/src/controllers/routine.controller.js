import { routineService } from '../services/routine.service.js';

export const routineController = {
  async create(req, res, next) {
    try {
      const { title, description, exercises } = req.body;
      const routine = await routineService.createRoutine({
        title,
        description,
        createdBy: req.user.id,
        exercises,
      });
      res.status(201).json({
        success: true,
        message: 'Rutina creada exitosamente con sus ejercicios.',
        data: { routine },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, exercises } = req.body;
      const routine = await routineService.updateRoutine(id, {
        title,
        description,
        exercises,
      });
      res.status(200).json({
        success: true,
        message: 'Rutina actualizada exitosamente.',
        data: { routine },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await routineService.deleteRoutine(id);
      res.status(200).json({
        success: true,
        message: 'Rutina eliminada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const routines = await routineService.getAllRoutines();
      res.status(200).json({
        success: true,
        data: { routines },
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyRoutines(req, res, next) {
    try {
      const routines = await routineService.getMyRoutines(req.user.id);
      res.status(200).json({
        success: true,
        data: { routines },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const routine = await routineService.getRoutineById(id, req.user);
      res.status(200).json({
        success: true,
        data: { routine },
      });
    } catch (error) {
      next(error);
    }
  },
};
