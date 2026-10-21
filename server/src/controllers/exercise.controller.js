import { exerciseService } from '../services/exercise.service.js';

export const exerciseController = {
  async getAll(req, res, next) {
    try {
      const { categoryId, search } = req.query;
      const exercises = await exerciseService.getAllExercises({
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
        search,
      });
      res.status(200).json({
        success: true,
        data: { exercises },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const exercise = await exerciseService.getExerciseById(id);
      res.status(200).json({
        success: true,
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { categoryId, title, description, videoUrl } = req.body;
      const exercise = await exerciseService.createExercise({
        categoryId,
        title,
        description,
        videoUrl,
      });
      res.status(201).json({
        success: true,
        message: 'Ejercicio creado exitosamente.',
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { categoryId, title, description, videoUrl } = req.body;
      const exercise = await exerciseService.updateExercise(id, {
        categoryId,
        title,
        description,
        videoUrl,
      });
      res.status(200).json({
        success: true,
        message: 'Ejercicio actualizado exitosamente.',
        data: { exercise },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await exerciseService.deleteExercise(id);
      res.status(200).json({
        success: true,
        message: 'Ejercicio eliminado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },
};
