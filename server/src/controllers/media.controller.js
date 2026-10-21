import { mediaService } from '../services/media.service.js';
import { supabaseStorageService } from '../services/supabaseStorage.service.js';

export const mediaController = {
  async getAll(req, res, next) {
    try {
      const { type, categoryId } = req.query;
      const media = await mediaService.getAllMedia({
        type,
        categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
      });
      res.status(200).json({
        success: true,
        data: { media },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await mediaService.getMediaById(id);
      res.status(200).json({
        success: true,
        data: { media: item },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { title, description, type, url, fileSizeBytes, categoryId } = req.body;
      const item = await mediaService.createMedia({
        title,
        description,
        type,
        url,
        fileSizeBytes,
        categoryId,
      });
      res.status(201).json({
        success: true,
        message: 'Recurso multimedia registrado exitosamente.',
        data: { media: item },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, type, url, fileSizeBytes, categoryId } = req.body;
      const item = await mediaService.updateMedia(id, {
        title,
        description,
        type,
        url,
        fileSizeBytes,
        categoryId,
      });
      res.status(200).json({
        success: true,
        message: 'Recurso multimedia actualizado exitosamente.',
        data: { media: item },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await mediaService.deleteMedia(id);
      res.status(200).json({
        success: true,
        message: 'Recurso multimedia eliminado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'No se envió ningún archivo para subir.',
        });
      }

      const uploaded = await supabaseStorageService.uploadFile(req.file, req);
      const isPdf = req.file.mimetype === 'application/pdf';
      const detectedType = isPdf ? 'PDF' : 'VIDEO';

      res.status(200).json({
        success: true,
        message: uploaded.storageType === 'SUPABASE'
          ? 'Archivo subido permanentemente a Supabase Storage.'
          : 'Archivo subido exitosamente.',
        data: {
          url: uploaded.url,
          filename: uploaded.filename,
          originalName: uploaded.originalName,
          sizeBytes: uploaded.size,
          mimetype: uploaded.mimetype,
          type: detectedType,
          storageType: uploaded.storageType,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
