import { query } from '../config/db.js';

export const releaseRepository = {
  async create({ userId, mediaResourceId, routineId, releaseDate, notes }) {
    const sql = `
      INSERT INTO content_releases (user_id, media_resource_id, routine_id, release_date, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, media_resource_id, routine_id, release_date, is_active, notes, created_at
    `;
    const res = await query(sql, [
      userId,
      mediaResourceId || null,
      routineId || null,
      releaseDate,
      notes ? notes.trim() : null,
    ]);
    return res.rows[0];
  },

  async findAll({ userId } = {}) {
    let sql = `
      SELECT cr.id, cr.release_date, cr.is_active, cr.notes, cr.created_at,
             u.id AS user_id, u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email,
             m.id AS media_id, m.title AS media_title, m.type AS media_type, m.url AS media_url,
             r.id AS routine_id, r.title AS routine_title
      FROM content_releases cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN media_resources m ON cr.media_resource_id = m.id
      LEFT JOIN routines r ON cr.routine_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND cr.user_id = $${params.length}`;
    }

    sql += ' ORDER BY cr.release_date DESC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findReleasedMediaByUserId(userId, { type } = {}) {
    let sql = `
      SELECT m.id, m.title, m.description, m.type, m.url, m.file_size_bytes,
             c.name AS category_name, cr.release_date, cr.notes AS release_notes
      FROM content_releases cr
      JOIN media_resources m ON cr.media_resource_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE cr.user_id = $1
        AND cr.is_active = TRUE
        AND cr.release_date <= CURRENT_TIMESTAMP
    `;
    const params = [userId];

    if (type) {
      params.push(type.toUpperCase());
      sql += ` AND m.type = $${params.length}`;
    }

    sql += ' ORDER BY cr.release_date DESC';
    const res = await query(sql, params);
    return res.rows;
  },

  async delete(id) {
    const sql = 'DELETE FROM content_releases WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
