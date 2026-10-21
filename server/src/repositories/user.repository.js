import { query } from '../config/db.js';

export const userRepository = {
  async findByEmail(email) {
    if (!email) return null;
    const sql = `
      SELECT id, first_name, last_name, email, password_hash, role, phone,
             trainer_id, account_status, goals, birth_date, is_active,
             is_presencial, is_online, plan_name, monthly_price, due_date,
             schedule_days, schedule_time, enrollment_date, notes,
             created_at, updated_at
      FROM users
      WHERE LOWER(email) = $1
    `;
    const res = await query(sql, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.phone,
             u.trainer_id, u.account_status, u.goals, u.birth_date, u.is_active,
             u.is_presencial, u.is_online, u.plan_name, u.monthly_price, u.due_date,
             u.schedule_days, u.schedule_time, u.enrollment_date, u.notes,
             u.created_at, u.updated_at,
             t.first_name || ' ' || t.last_name AS trainer_name
      FROM users u
      LEFT JOIN users t ON u.trainer_id = t.id
      WHERE u.id = $1
    `;
    const res = await query(sql, [id]);
    const user = res.rows[0] || null;
    if (!user) return null;

    // Obtener pagos del cliente
    const paymentsRes = await query(`
      SELECT * FROM payments WHERE user_id = $1 ORDER BY payment_date DESC, id DESC
    `, [id]);
    user.payments = paymentsRes.rows || [];

    // Obtener contenidos liberados y rutinas asignadas
    const releasesRes = await query(`
      SELECT cr.id, cr.release_date, cr.is_active, cr.notes,
             r.id as routine_id, r.title as routine_title,
             m.id as media_id, m.title as media_title, m.type as media_type, m.url as media_url
      FROM content_releases cr
      LEFT JOIN routines r ON cr.routine_id = r.id
      LEFT JOIN media_resources m ON cr.media_resource_id = m.id
      WHERE cr.user_id = $1
      ORDER BY cr.release_date DESC
    `, [id]);
    user.releases = releasesRes.rows || [];

    // Obtener eventos/meets asignados
    const eventsRes = await query(`
      SELECT * FROM calendar_events WHERE user_id = $1 ORDER BY event_date DESC
    `, [id]);
    user.events = eventsRes.rows || [];

    return user;
  },

  async create({
    firstName,
    lastName = '',
    email = null,
    passwordHash = null,
    role = 'ALUMNO',
    phone = null,
    trainerId = null,
    accountStatus = 'ACTIVO',
    goals = null,
    birthDate = null,
    isPresencial = 1,
    isOnline = 0,
    planName = 'Pase Libre',
    monthlyPrice = 0,
    dueDate = null,
    scheduleDays = '[1,2,3,4,5]',
    scheduleTime = '09:00',
    enrollmentDate = null,
    notes = ''
  }) {
    const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : null;
    const cleanEnrollDate = enrollmentDate || new Date().toISOString().split('T')[0];
    
    // Si no se asignó due_date y es presencial, fijar a 30 días
    let calculatedDueDate = dueDate;
    if (!calculatedDueDate && isPresencial) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      calculatedDueDate = d.toISOString().split('T')[0];
    }

    const sql = `
      INSERT INTO users (
        first_name, last_name, email, password_hash, role, phone,
        trainer_id, account_status, goals, birth_date,
        is_presencial, is_online, plan_name, monthly_price, due_date,
        schedule_days, schedule_time, enrollment_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id, first_name, last_name, email, role, phone, trainer_id,
                account_status, goals, birth_date, is_active,
                is_presencial, is_online, plan_name, monthly_price, due_date,
                schedule_days, schedule_time, enrollment_date, notes, created_at
    `;
    const res = await query(sql, [
      firstName.trim(),
      lastName ? lastName.trim() : '',
      cleanEmail,
      passwordHash,
      role,
      phone ? phone.trim() : null,
      trainerId ? parseInt(trainerId, 10) : null,
      accountStatus,
      goals,
      birthDate,
      isPresencial ? 1 : 0,
      isOnline ? 1 : 0,
      planName || 'Pase Libre',
      Number(monthlyPrice) || 0,
      calculatedDueDate,
      typeof scheduleDays === 'string' ? scheduleDays : JSON.stringify(scheduleDays || []),
      scheduleTime || '09:00',
      cleanEnrollDate,
      notes || ''
    ]);
    return res.rows[0];
  },

  async findAll({ role, isActive, trainerId, search, status, type } = {}) {
    let sql = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.phone,
             u.trainer_id, u.account_status, u.goals, u.birth_date, u.is_active,
             u.is_presencial, u.is_online, u.plan_name, u.monthly_price, u.due_date,
             u.schedule_days, u.schedule_time, u.enrollment_date, u.notes, u.created_at,
             t.first_name || ' ' || t.last_name AS trainer_name
      FROM users u
      LEFT JOIN users t ON u.trainer_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      params.push(role);
      sql += ` AND u.role = $${params.length}`;
    }

    if (typeof isActive === 'boolean') {
      params.push(isActive ? 1 : 0);
      sql += ` AND u.is_active = $${params.length}`;
    }

    if (trainerId) {
      params.push(parseInt(trainerId, 10));
      sql += ` AND u.trainer_id = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND u.account_status = $${params.length}`;
    }

    if (type === 'presencial') {
      sql += ` AND u.is_presencial = 1 AND u.is_online = 0`;
    } else if (type === 'online') {
      sql += ` AND u.is_online = 1 AND u.is_presencial = 0`;
    } else if (type === 'hybrid') {
      sql += ` AND u.is_presencial = 1 AND u.is_online = 1`;
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q);
      const idx = params.length;
      sql += ` AND (LOWER(u.first_name) LIKE $${idx} OR LOWER(u.last_name) LIKE $${idx} OR (u.phone IS NOT NULL AND u.phone LIKE $${idx}) OR (u.email IS NOT NULL AND LOWER(u.email) LIKE $${idx}))`;
    }

    sql += ' ORDER BY u.first_name ASC, u.id DESC';
    const res = await query(sql, params);
    return res.rows;
  },

  async update(id, updates) {
    const fields = [];
    const params = [id];

    const allowed = {
      firstName: 'first_name',
      first_name: 'first_name',
      lastName: 'last_name',
      last_name: 'last_name',
      phone: 'phone',
      email: 'email',
      isActive: 'is_active',
      is_active: 'is_active',
      role: 'role',
      trainerId: 'trainer_id',
      trainer_id: 'trainer_id',
      accountStatus: 'account_status',
      account_status: 'account_status',
      goals: 'goals',
      birthDate: 'birth_date',
      birth_date: 'birth_date',
      isPresencial: 'is_presencial',
      is_presencial: 'is_presencial',
      isOnline: 'is_online',
      is_online: 'is_online',
      planName: 'plan_name',
      plan_name: 'plan_name',
      monthlyPrice: 'monthly_price',
      monthly_price: 'monthly_price',
      dueDate: 'due_date',
      due_date: 'due_date',
      scheduleDays: 'schedule_days',
      schedule_days: 'schedule_days',
      scheduleTime: 'schedule_time',
      schedule_time: 'schedule_time',
      enrollmentDate: 'enrollment_date',
      enrollment_date: 'enrollment_date',
      notes: 'notes'
    };

    for (const [key, col] of Object.entries(allowed)) {
      if (updates[key] !== undefined) {
        let val = updates[key];
        if (key === 'email' && val) val = val.toLowerCase().trim();
        if (key === 'email' && !val) val = null;
        if (key === 'isActive' || key === 'isPresencial' || key === 'isOnline') val = val ? 1 : 0;
        if (key === 'scheduleDays' && typeof val !== 'string') val = JSON.stringify(val);
        if (key === 'monthlyPrice') val = Number(val) || 0;

        params.push(val);
        fields.push(`${col} = $${params.length}`);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING id, first_name, last_name, email, role, phone, trainer_id,
                account_status, goals, birth_date, is_active,
                is_presencial, is_online, plan_name, monthly_price, due_date,
                schedule_days, schedule_time, enrollment_date, notes, updated_at
    `;
    const res = await query(sql, params);
    return res.rows[0] || null;
  },

  async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },

  async findByIdWithPassword(id) {
    const sql = `SELECT * FROM users WHERE id = $1`;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const sql = `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id`;
    const res = await query(sql, [passwordHash, id]);
    return res.rowCount > 0;
  },
};
