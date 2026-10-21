import { routineRepository } from '../repositories/routine.repository.js';
import { exerciseRepository } from '../repositories/exercise.repository.js';

export const routineService = {
  async createRoutine({ title, description, createdBy, exercises }) {
    if (!title || title.trim().length === 0) {
      const error = new Error('El título de la rutina es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (!ex.exerciseId) {
          const error = new Error('Cada ejercicio de la rutina debe contener un exerciseId válido.');
          error.statusCode = 400;
          throw error;
        }
        const exists = await exerciseRepository.findById(ex.exerciseId);
        if (!exists) {
          const error = new Error(`El ejercicio con ID ${ex.exerciseId} no existe.`);
          error.statusCode = 404;
          throw error;
        }
      }
    }

    return routineRepository.createWithExercises({
      title,
      description,
      createdBy,
      exercises,
    });
  },

  async updateRoutine(id, { title, description, exercises }) {
    if (!title || title.trim().length === 0) {
      const error = new Error('El título de la rutina es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await routineRepository.findById(id);
    if (!existing) {
      const error = new Error('Rutina no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (!ex.exerciseId) {
          const error = new Error('Cada ejercicio de la rutina debe contener un exerciseId válido.');
          error.statusCode = 400;
          throw error;
        }
      }
    }

    return routineRepository.updateWithExercises(id, { title, description, exercises });
  },

  async deleteRoutine(id) {
    const existing = await routineRepository.findById(id);
    if (!existing) {
      const error = new Error('Rutina no encontrada.');
      error.statusCode = 404;
      throw error;
    }
    return routineRepository.delete(id);
  },

  async getAllRoutines() {
    return routineRepository.findAll();
  },

  async getRoutineById(id, requestingUser) {
    const routine = await routineRepository.findById(id);
    if (!routine) {
      const error = new Error('Rutina no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    // Si el usuario es Alumno, validar si tiene la rutina liberada
    if (requestingUser.role === 'ALUMNO') {
      const isAllowed = await routineRepository.isReleasedToUser(id, requestingUser.id);
      if (!isAllowed) {
        const error = new Error('No tienes acceso a esta rutina o aún no ha sido liberada.');
        error.statusCode = 403;
        throw error;
      }
    }

    return routine;
  },

  async getMyRoutines(userId) {
    return routineRepository.findReleasedByUserId(userId);
  },
};
