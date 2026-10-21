import { query } from '../config/db.js';

export const exerciseRepository = {
  async findAll({ categoryId, search } = {}) {
    let sql = `
      SELECT e.id, e.title, e.description, e.video_url, e.created_at,
             c.id AS category_id, c.name AS category_name
      FROM exercises e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND e.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (e.title ILIKE $${params.length} OR e.description ILIKE $${params.length})`;
    }

    sql += ' ORDER BY e.title ASC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findById(id) {
    const sql = `
      SELECT e.id, e.title, e.description, e.video_url, e.created_at,
             c.id AS category_id, c.name AS category_name
      FROM exercises e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async create({ categoryId, title, description, videoUrl }) {
    const sql = `
      INSERT INTO exercises (category_id, title, description, video_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category_id, title, description, video_url, created_at
    `;
    const res = await query(sql, [
      categoryId || null,
      title.trim(),
      description ? description.trim() : null,
      videoUrl ? videoUrl.trim() : null,
    ]);
    return res.rows[0];
  },

  async update(id, { categoryId, title, description, videoUrl }) {
    const fields = [];
    const params = [id];

    if (categoryId !== undefined) {
      params.push(categoryId);
      fields.push(`category_id = $${params.length}`);
    }
    if (title) {
      params.push(title.trim());
      fields.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description ? description.trim() : null);
      fields.push(`description = $${params.length}`);
    }
    if (videoUrl !== undefined) {
      params.push(videoUrl ? videoUrl.trim() : null);
      fields.push(`video_url = $${params.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    const sql = `
      UPDATE exercises
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id, category_id, title, description, video_url, created_at
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    await query('DELETE FROM routine_exercises WHERE exercise_id = $1', [id]);
    const sql = 'DELETE FROM exercises WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },

};
