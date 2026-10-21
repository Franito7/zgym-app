import { releaseService } from '../services/release.service.js';

export const releaseController = {
  async create(req, res, next) {
    try {
      const { userId, userIds, mediaResourceId, routineId, releaseDate, notes } = req.body;
      const release = await releaseService.createRelease({
        userId,
        userIds,
        mediaResourceId,
        routineId,
        releaseDate,
        notes,
      });
      res.status(201).json({
        success: true,
        message: 'Contenido liberado/programado exitosamente.',
        data: { release },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const { userId } = req.query;
      const releases = await releaseService.getAllReleases({
        userId: userId ? parseInt(userId, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: { releases },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await releaseService.deleteRelease(id);
      res.status(200).json({
        success: true,
        message: 'Liberación de contenido revocada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyContent(req, res, next) {
    try {
      const { type } = req.query; // 'VIDEO' o 'PDF'
      const content = await releaseService.getMyReleasedMedia(req.user.id, { type });
      res.status(200).json({
        success: true,
        data: { content },
      });
    } catch (error) {
      next(error);
    }
  },
};
