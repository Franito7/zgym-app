import { categoryRepository } from '../repositories/category.repository.js';

export const categoryService = {
  async getAllCategories() {
    return categoryRepository.findAll();
  },

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      const error = new Error('Categoría no encontrada.');
      error.statusCode = 404;
      throw error;
    }
    return category;
  },

  async createCategory({ name, description }) {
    if (!name || name.trim().length === 0) {
      const error = new Error('El nombre de la categoría es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await categoryRepository.findByName(name);
    if (existing) {
      const error = new Error('Ya existe una categoría con este nombre.');
      error.statusCode = 409;
      throw error;
    }

    return categoryRepository.create({ name, description });
  },

  async updateCategory(id, { name, description }) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      const error = new Error('Categoría no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await categoryRepository.findByName(name);
      if (duplicate) {
        const error = new Error('Ya existe otra categoría con este nombre.');
        error.statusCode = 409;
        throw error;
      }
    }

    return categoryRepository.update(id, { name, description });
  },

  async deleteCategory(id) {
    const deleted = await categoryRepository.delete(id);
    if (!deleted) {
      const error = new Error('Categoría no encontrada o no pudo eliminarse.');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },
};
