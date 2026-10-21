import { query } from '../config/db.js';

export const calendarRepository = {
  async create({ userId, title, eventDate, type = 'AUDITORIA', status = 'PENDIENTE', notes = null, meetUrl = null }) {
    const sql = `
      INSERT INTO calendar_events (user_id, title, event_date, type, status, notes, meet_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, title, event_date, type, status, notes, meet_url, created_at
    `;
    const res = await query(sql, [
      userId,
      title.trim(),
      eventDate,
      type.toUpperCase(),
      status.toUpperCase(),
      notes ? notes.trim() : null,
      meetUrl ? meetUrl.trim() : null,
    ]);
    return res.rows[0];
  },

  async addAttendee(eventId, userId) {
    const sql = `
      INSERT INTO calendar_event_attendees (event_id, user_id)
      VALUES ($1, $2)
      RETURNING id, event_id, user_id, created_at
    `;
    const res = await query(sql, [eventId, userId]);
    return res.rows[0];
  },

  async isAttendee(eventId, userId) {
    const sql = 'SELECT id FROM calendar_event_attendees WHERE event_id = $1 AND user_id = $2';
    const res = await query(sql, [eventId, userId]);
    return res.rows.length > 0;
  },

  async findByUserId(userId, { startDate, endDate, type } = {}) {
    let sql = `
      SELECT DISTINCT ce.id, ce.user_id, ce.title, ce.event_date, ce.type, ce.status, ce.notes, ce.meet_url, ce.created_at
      FROM calendar_events ce
      LEFT JOIN calendar_event_attendees cea ON ce.id = cea.event_id
      WHERE (ce.user_id = $1 OR cea.user_id = $1)
    `;
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      sql += ` AND ce.event_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND ce.event_date <= $${params.length}`;
    }

    if (type) {
      params.push(type.toUpperCase());
      sql += ` AND ce.type = $${params.length}`;
    }

    sql += ' ORDER BY ce.event_date ASC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findAll({ userId, startDate, endDate, type } = {}) {
    let sql = `
      SELECT ce.id, ce.title, ce.event_date, ce.type, ce.status, ce.notes, ce.meet_url, ce.created_at,
             u.id AS user_id, u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email
      FROM calendar_events ce
      JOIN users u ON ce.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND ce.user_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND ce.event_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND ce.event_date <= $${params.length}`;
    }

    if (type) {
      params.push(type.toUpperCase());
      sql += ` AND ce.type = $${params.length}`;
    }

    sql += ' ORDER BY ce.event_date ASC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findById(id) {
    const sql = `
      SELECT ce.id, ce.user_id, ce.title, ce.event_date, ce.type, ce.status, ce.notes, ce.meet_url, ce.created_at,
             u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email
      FROM calendar_events ce
      JOIN users u ON ce.user_id = u.id
      WHERE ce.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async update(id, { title, eventDate, type, status, notes, meetUrl }) {
    const fields = [];
    const params = [id];

    if (title) {
      params.push(title.trim());
      fields.push(`title = $${params.length}`);
    }
    if (eventDate) {
      params.push(eventDate);
      fields.push(`event_date = $${params.length}`);
    }
    if (type) {
      params.push(type.toUpperCase());
      fields.push(`type = $${params.length}`);
    }
    if (status) {
      params.push(status.toUpperCase());
      fields.push(`status = $${params.length}`);
    }
    if (notes !== undefined) {
      params.push(notes ? notes.trim() : null);
      fields.push(`notes = $${params.length}`);
    }
    if (meetUrl !== undefined) {
      params.push(meetUrl ? meetUrl.trim() : null);
      fields.push(`meet_url = $${params.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    const sql = `
      UPDATE calendar_events
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id, user_id, title, event_date, type, status, notes, meet_url
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async updateStatus(id, status) {
    const sql = `
      UPDATE calendar_events
      SET status = $1
      WHERE id = $2
      RETURNING id, user_id, title, event_date, type, status, notes, meet_url
    `;
    const res = await query(sql, [status.toUpperCase(), id]);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = 'DELETE FROM calendar_events WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },
};
