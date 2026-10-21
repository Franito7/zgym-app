import { categoryService } from '../services/category.service.js';

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);
      res.status(200).json({
        success: true,
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const category = await categoryService.createCategory({ name, description });
      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente.',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const category = await categoryService.updateCategory(id, { name, description });
      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente.',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },
};
