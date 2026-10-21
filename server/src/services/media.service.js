import { mediaRepository } from '../repositories/media.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';

export const mediaService = {
  async getAllMedia(filters) {
    return mediaRepository.findAll(filters);
  },

  async getMediaById(id) {
    const item = await mediaRepository.findById(id);
    if (!item) {
      const error = new Error('Recurso multimedia no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return item;
  },

  async createMedia({ title, description, type, url, fileSizeBytes, categoryId }) {
    if (!title || title.trim().length === 0) {
      const error = new Error('El título del recurso es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (!type || !['VIDEO', 'PDF'].includes(type.toUpperCase())) {
      const error = new Error("El tipo debe ser estrictamente 'VIDEO' o 'PDF'.");
      error.statusCode = 400;
      throw error;
    }

    if (!url || url.trim().length === 0) {
      const error = new Error('La URL del recurso es obligatoria.');
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

    return mediaRepository.create({
      title,
      description,
      type: type.toUpperCase(),
      url,
      fileSizeBytes,
      categoryId,
    });
  },

  async updateMedia(id, updateData) {
    const existing = await mediaRepository.findById(id);
    if (!existing) {
      const error = new Error('Recurso multimedia no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.type && !['VIDEO', 'PDF'].includes(updateData.type.toUpperCase())) {
      const error = new Error("El tipo debe ser estrictamente 'VIDEO' o 'PDF'.");
      error.statusCode = 400;
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

    return mediaRepository.update(id, updateData);
  },

  async deleteMedia(id) {
    const deleted = await mediaRepository.delete(id);
    if (!deleted) {
      const error = new Error('Recurso no encontrado o no pudo eliminarse.');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },
};
