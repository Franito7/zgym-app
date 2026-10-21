import { query } from '../config/db.js';

export const dashboardController = {
  async getCoachDashboard(req, res, next) {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonth = todayStr.substring(0, 7);

      // Día de la semana JS: 0=Dom, 1=Lun, ..., 6=Sab
      const jsDay = new Date().getDay();
      const dayOfWeek = jsDay === 0 ? 7 : jsDay;

      // 1. Obtener todos los alumnos activos
      const usersRes = await query(`
        SELECT id, first_name, last_name, phone, email, plan_name, monthly_price,
               due_date, schedule_days, schedule_time, account_status,
               is_presencial, is_online
        FROM users
        WHERE role = 'ALUMNO' AND is_active = 1
      `);
      const allStudents = usersRes.rows || [];

      const activeStudents = allStudents.filter(s => s.account_status === 'ACTIVO').length;

      // 2. Alumnos con cuota por vencer en los próximos 7 días
      const expiringStudents = allStudents.filter(s => {
        if (!s.is_presencial || !s.due_date || s.account_status === 'SUSPENDIDO') return false;
        const diffDays = Math.ceil((new Date(s.due_date).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

      // 3. Alumnos vencidos (atrasados)
      const overdueStudents = allStudents.filter(s => {
        if (!s.is_presencial || !s.due_date || s.account_status === 'SUSPENDIDO') return false;
        return s.due_date < todayStr;
      }).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

      // 4. Alumnos de hoy según cronograma presencial
      const todayStudents = allStudents.filter(s => {
        if (!s.is_presencial || s.account_status === 'SUSPENDIDO') return false;
        try {
          const days = typeof s.schedule_days === 'string' ? JSON.parse(s.schedule_days || '[]') : s.schedule_days;
          return Array.isArray(days) && days.includes(dayOfWeek);
        } catch {
          return false;
        }
      }).sort((a, b) => (a.schedule_time || '09:00').localeCompare(b.schedule_time || '09:00'));

      // 5. Ingresos del mes y pagos recientes
      const paymentsRes = await query(`
        SELECT p.*, u.first_name, u.last_name, u.phone, u.plan_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'paid'
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 20
      `);
      const recentPayments = paymentsRes.rows || [];

      const monthRevenue = recentPayments
        .filter(p => p.payment_date && p.payment_date.startsWith(currentMonth))
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      // 6. Citas / Meets / Auditorías del día
      const eventsRes = await query(`
        SELECT ce.*, u.first_name, u.last_name, u.phone
        FROM calendar_events ce
        JOIN users u ON ce.user_id = u.id
        WHERE ce.event_date LIKE $1 AND ce.status != 'CANCELADO'
        ORDER BY ce.event_date ASC
      `, [`${todayStr}%`]);
      const todayEvents = eventsRes.rows || [];

      res.status(200).json({
        success: true,
        data: {
          todayStr,
          dayOfWeek,
          activeStudents,
          totalStudents: allStudents.length,
          expiringStudentsCount: expiringStudents.length,
          expiringStudents,
          overdueStudentsCount: overdueStudents.length,
          overdueStudents,
          todayStudentsCount: todayStudents.length,
          todayStudents,
          monthRevenue,
          recentPayments: recentPayments.slice(0, 6),
          todayEventsCount: todayEvents.length,
          todayEvents
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
