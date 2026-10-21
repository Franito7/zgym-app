import { exerciseRepository } from '../repositories/exercise.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';

export const exerciseService = {
  async getAllExercises(filters) {
    return exerciseRepository.findAll(filters);
  },

  async getExerciseById(id) {
    const exercise = await exerciseRepository.findById(id);
    if (!exercise) {
      const error = new Error('Ejercicio no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return exercise;
  },

  async createExercise({ categoryId, title, description, videoUrl }) {
    if (!title || title.trim().length === 0) {
      const error = new Error('El título del ejercicio es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        const error = new Error('La categoría especificada no existe.');
        error.statusCode = 404;
        throw error;
      }
    }

    return exerciseRepository.create({ categoryId, title, description, videoUrl });
  },

  async updateExercise(id, updateData) {
    const existing = await exerciseRepository.findById(id);
    if (!existing) {
      const error = new Error('Ejercicio no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.categoryId) {
      const category = await categoryRepository.findById(updateData.categoryId);
      if (!category) {
        const error = new Error('La categoría especificada no existe.');
        error.statusCode = 404;
        throw error;
      }
    }

    return exerciseRepository.update(id, updateData);
  },

  async deleteExercise(id) {
    const deleted = await exerciseRepository.delete(id);
    if (!deleted) {
      const error = new Error('Ejercicio no encontrado o no pudo eliminarse.');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },
};
