import { query } from '../config/db.js';

export const mediaRepository = {
  async findAll({ type, categoryId } = {}) {
    let sql = `
      SELECT m.id, m.title, m.description, m.type, m.url, m.file_size_bytes, m.created_at,
             c.id AS category_id, c.name AS category_name
      FROM media_resources m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type.toUpperCase());
      sql += ` AND m.type = $${params.length}`;
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND m.category_id = $${params.length}`;
    }

    sql += ' ORDER BY m.created_at DESC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findById(id) {
    const sql = `
      SELECT m.id, m.title, m.description, m.type, m.url, m.file_size_bytes, m.created_at,
             c.id AS category_id, c.name AS category_name
      FROM media_resources m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async create({ title, description, type, url, fileSizeBytes, categoryId }) {
    const sql = `
      INSERT INTO media_resources (title, description, type, url, file_size_bytes, category_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, description, type, url, file_size_bytes, category_id, created_at
    `;
    const res = await query(sql, [
      title.trim(),
      description ? description.trim() : null,
      type.toUpperCase(),
      url.trim(),
      fileSizeBytes || null,
      categoryId || null,
    ]);
    return res.rows[0];
  },

  async update(id, { title, description, type, url, fileSizeBytes, categoryId }) {
    const fields = [];
    const params = [id];

    if (title) {
      params.push(title.trim());
      fields.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description ? description.trim() : null);
      fields.push(`description = $${params.length}`);
    }
    if (type) {
      params.push(type.toUpperCase());
      fields.push(`type = $${params.length}`);
    }
    if (url) {
      params.push(url.trim());
      fields.push(`url = $${params.length}`);
    }
    if (fileSizeBytes !== undefined) {
      params.push(fileSizeBytes);
      fields.push(`file_size_bytes = $${params.length}`);
    }
    if (categoryId !== undefined) {
      params.push(categoryId);
      fields.push(`category_id = $${params.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    const sql = `
      UPDATE media_resources
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id, title, description, type, url, file_size_bytes, category_id, created_at
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    // Las liberaciones de este recurso dejan de tener sentido: se eliminan para no dejar filas huérfanas
    await query('DELETE FROM content_releases WHERE media_resource_id = $1', [id]);
    const sql = 'DELETE FROM media_resources WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
