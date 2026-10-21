import { query } from '../config/db.js';

export const paymentRepository = {
  async create({ userId, amount, paymentDate, paymentMethod = 'Efectivo', period, notes = '', status = 'paid', nextDueDate = null }) {
    const cleanDate = paymentDate || new Date().toISOString().split('T')[0];
    const cleanPeriod = period || cleanDate.substring(0, 7);

    const sql = `
      INSERT INTO payments (user_id, amount, payment_date, payment_method, period, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, amount, payment_date, payment_method, period, notes, status, created_at
    `;
    const res = await query(sql, [
      parseInt(userId, 10),
      Number(amount) || 0,
      cleanDate,
      paymentMethod,
      cleanPeriod,
      notes || '',
      status
    ]);
    const payment = res.rows[0];

    // Si se especifica próxima fecha de vencimiento, actualizar al cliente
    if (nextDueDate) {
      await query(`
        UPDATE users
        SET due_date = $1, account_status = 'ACTIVO', updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [nextDueDate, parseInt(userId, 10)]);
    }

    return payment;
  },

  async findAll({ userId, month, search } = {}) {
    let sql = `
      SELECT p.id, p.user_id, p.amount, p.payment_date, p.payment_method, p.period, p.notes, p.status, p.created_at,
             u.first_name, u.last_name, u.phone, u.plan_name, u.email
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(parseInt(userId, 10));
      sql += ` AND p.user_id = $${params.length}`;
    }

    if (month) {
      params.push(`${month}%`);
      sql += ` AND p.payment_date LIKE $${params.length}`;
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q);
      const idx = params.length;
      sql += ` AND (LOWER(u.first_name) LIKE $${idx} OR LOWER(u.last_name) LIKE $${idx} OR (u.phone IS NOT NULL AND u.phone LIKE $${idx}))`;
    }

    sql += ' ORDER BY p.payment_date DESC, p.id DESC';
    const res = await query(sql, params);
    return res.rows;
  },

  async findById(id) {
    const sql = `
      SELECT p.*, u.first_name, u.last_name, u.phone, u.plan_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = 'DELETE FROM payments WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  }
};
