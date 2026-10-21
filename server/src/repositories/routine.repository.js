import { query, getClient } from '../config/db.js';

export const routineRepository = {
  async createWithExercises({ title, description, createdBy, exercises }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const routineSql = `
        INSERT INTO routines (title, description, created_by)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, created_by, created_at
      `;
      const routineRes = await client.query(routineSql, [
        title.trim(),
        description ? description.trim() : null,
        createdBy,
      ]);
      const routine = routineRes.rows[0];

      const insertedExercises = [];
      if (Array.isArray(exercises) && exercises.length > 0) {
        const itemSql = `
          INSERT INTO routine_exercises (routine_id, exercise_id, day_of_week, sets, reps, notes, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, routine_id, exercise_id, day_of_week, sets, reps, notes, order_index
        `;
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          const itemRes = await client.query(itemSql, [
            routine.id,
            ex.exerciseId,
            ex.dayOfWeek || 'Día 1',
            ex.sets || 3,
            ex.reps || '10-12',
            ex.notes || null,
            ex.orderIndex || i + 1,
          ]);
          insertedExercises.push(itemRes.rows[0]);
        }
      }

      await client.query('COMMIT');
      return {
        ...routine,
        exercises: insertedExercises,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateWithExercises(id, { title, description, exercises }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updateSql = `
        UPDATE routines
        SET title = $1, description = $2
        WHERE id = $3
        RETURNING id, title, description, created_by, created_at
      `;
      const routineRes = await client.query(updateSql, [
        title.trim(),
        description ? description.trim() : null,
        id,
      ]);

      if (routineRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const routine = routineRes.rows[0];

      // Si se enviaron ejercicios nuevos, reemplazar los existentes
      if (Array.isArray(exercises)) {
        await client.query('DELETE FROM routine_exercises WHERE routine_id = $1', [id]);

        const itemSql = `
          INSERT INTO routine_exercises (routine_id, exercise_id, day_of_week, sets, reps, notes, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, routine_id, exercise_id, day_of_week, sets, reps, notes, order_index
        `;
        const insertedExercises = [];
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          const itemRes = await client.query(itemSql, [
            routine.id,
            ex.exerciseId,
            ex.dayOfWeek || 'Día 1',
            ex.sets || 3,
            ex.reps || '10-12',
            ex.notes || null,
            ex.orderIndex || i + 1,
          ]);
          insertedExercises.push(itemRes.rows[0]);
        }
        routine.exercises = insertedExercises;
      }

      await client.query('COMMIT');
      return routine;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    await query('DELETE FROM routine_exercises WHERE routine_id = $1', [id]);
    await query('DELETE FROM content_releases WHERE routine_id = $1', [id]);
    const sql = 'DELETE FROM routines WHERE id = $1 RETURNING id';
    const res = await query(sql, [id]);
    return res.rowCount > 0;
  },


  async findAll() {
    const sql = `
      SELECT r.id, r.title, r.description, r.created_at,
             u.first_name || ' ' || u.last_name AS creator_name,
             COUNT(re.id)::int AS total_exercises
      FROM routines r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN routine_exercises re ON r.id = re.routine_id
      GROUP BY r.id, u.first_name, u.last_name
      ORDER BY r.created_at DESC
    `;
    const res = await query(sql);
    return res.rows;
  },

  async findById(id) {
    const routineSql = `
      SELECT r.id, r.title, r.description, r.created_at,
             u.first_name || ' ' || u.last_name AS creator_name
      FROM routines r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = $1
    `;
    const routineRes = await query(routineSql, [id]);
    if (routineRes.rows.length === 0) return null;

    const routine = routineRes.rows[0];

    const exercisesSql = `
      SELECT re.id, re.day_of_week, re.sets, re.reps, re.notes, re.order_index,
             e.id AS exercise_id, e.title, e.description, e.video_url,
             c.name AS category_name
      FROM routine_exercises re
      JOIN exercises e ON re.exercise_id = e.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE re.routine_id = $1
      ORDER BY re.day_of_week ASC, re.order_index ASC
    `;
    const exercisesRes = await query(exercisesSql, [id]);
    routine.exercises = exercisesRes.rows;

    return routine;
  },

  async findReleasedByUserId(userId) {
    const sql = `
      SELECT r.id, r.title, r.description, cr.release_date, cr.notes AS release_notes,
             COUNT(re.id)::int AS total_exercises
      FROM content_releases cr
      JOIN routines r ON cr.routine_id = r.id
      LEFT JOIN routine_exercises re ON r.id = re.routine_id
      WHERE cr.user_id = $1
        AND cr.is_active = TRUE
        AND cr.release_date <= CURRENT_TIMESTAMP
      GROUP BY r.id, cr.release_date, cr.notes
      ORDER BY cr.release_date DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  },

  async isReleasedToUser(routineId, userId) {
    const sql = `
      SELECT id FROM content_releases
      WHERE user_id = $1
        AND routine_id = $2
        AND is_active = TRUE
        AND release_date <= CURRENT_TIMESTAMP
    `;
    const res = await query(sql, [userId, routineId]);
    return res.rows.length > 0;
  },
};
