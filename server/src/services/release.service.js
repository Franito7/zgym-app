import { releaseRepository } from '../repositories/release.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { mediaRepository } from '../repositories/media.repository.js';
import { routineRepository } from '../repositories/routine.repository.js';

export const releaseService = {
  async createRelease({ userId, userIds, mediaResourceId, routineId, releaseDate, notes }) {
    // Normalizar a lista de IDs de usuarios destinatarios
    let targetUserIds = [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds.map((id) => parseInt(id, 10)).filter(Boolean);
    } else if (userId) {
      targetUserIds = [parseInt(userId, 10)];
    }

    if (targetUserIds.length === 0) {
      const error = new Error('Debes seleccionar al menos un alumno destinatario para liberar el contenido.');
      error.statusCode = 400;
      throw error;
    }

    if (!mediaResourceId && !routineId) {
      const error = new Error('Debe especificar al menos un recurso multimedia o una rutina para liberar.');
      error.statusCode = 400;
      throw error;
    }

    if (mediaResourceId) {
      const media = await mediaRepository.findById(mediaResourceId);
      if (!media) {
        const error = new Error('El recurso multimedia especificado no existe.');
        error.statusCode = 404;
        throw error;
      }
    }

    if (routineId) {
      const routine = await routineRepository.findById(routineId);
      if (!routine) {
        const error = new Error('La rutina especificada no existe.');
        error.statusCode = 404;
        throw error;
      }
    }

    const date = releaseDate ? new Date(releaseDate) : new Date();
    if (isNaN(date.getTime())) {
      const error = new Error('La fecha de liberación provista es inválida.');
      error.statusCode = 400;
      throw error;
    }

    const createdReleases = [];
    for (const uid of targetUserIds) {
      const user = await userRepository.findById(uid);
      if (user) {
        const rel = await releaseRepository.create({
          userId: uid,
          mediaResourceId,
          routineId,
          releaseDate: date.toISOString(),
          notes,
        });
        createdReleases.push(rel);
      }
    }

    return createdReleases.length === 1 ? createdReleases[0] : createdReleases;
  },

  async getAllReleases(filters) {
    return releaseRepository.findAll(filters);
  },

  async deleteRelease(id) {
    const deleted = await releaseRepository.delete(id);
    if (!deleted) {
      const error = new Error('Liberación no encontrada o ya eliminada.');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },

  async getMyReleasedMedia(userId, { type } = {}) {
    return releaseRepository.findReleasedMediaByUserId(userId, { type });
  },
};
