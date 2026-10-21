import { query } from '../config/db.js';

export const categoryRepository = {
  async findAll() {
    const sql = 'SELECT id, name, description, created_at FROM categories ORDER BY name ASC';
    const res = await query(sql);
    return res.rows;
  },

  async findById(id) {
    const sql = 'SELECT id, name, description, created_at FROM categories WHERE id = $1';
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async findByName(name) {
    const sql = 'SELECT id, name, description, created_at FROM categories WHERE LOWER(name) = LOWER($1)';
    const res = await query(sql, [name.trim()]);
    return res.rows[0] || null;
  },

  async create({ name, description }) {
    const sql = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, created_at
    `;
    const res = await query(sql, [name.trim(), description ? description.trim() : null]);
    return res.rows[0];
  },

  async update(id, { name, description }) {
    const sql = `
      UPDATE categories
      SET name = COALESCE($1, name),
          description = COALESCE($2, description)
      WHERE id = $3
      RETURNING id, name, description, created_at
    `;
    const res = await query(sql, [name ? name.trim() : null, description ? description.trim() : null, id]);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = 'DELETE FROM categories WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
