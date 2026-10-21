import { calendarRepository } from '../repositories/calendar.repository.js';
import { userRepository } from '../repositories/user.repository.js';

const ALLOWED_TYPES = ['AUDITORIA', 'ENTRENAMIENTO', 'CONTROL', 'MEET', 'SEGUIMIENTO', 'EVENTO', 'LIBERACION'];
const ALLOWED_STATUSES = ['PENDIENTE', 'COMPLETADO', 'CANCELADO'];

export const calendarService = {
  async createEvent({ userId, userIds, title, eventDate, type = 'AUDITORIA', status = 'PENDIENTE', notes, meetUrl }) {
    let targetUserIds = [];
    if (Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds.map((id) => parseInt(id, 10)).filter(Boolean);
    } else if (userId) {
      targetUserIds = [parseInt(userId, 10)];
    }

    if (targetUserIds.length === 0) {
      const error = new Error('Debes asociar al menos un alumno al evento.');
      error.statusCode = 400;
      throw error;
    }

    if (!title || title.trim().length === 0) {
      const error = new Error('El título del evento es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    if (!ALLOWED_TYPES.includes(type.toUpperCase())) {
      const error = new Error(`Tipo de evento inválido. Valores permitidos: [${ALLOWED_TYPES.join(', ')}].`);
      error.statusCode = 400;
      throw error;
    }

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error('La fecha del evento es inválida.');
      error.statusCode = 400;
      throw error;
    }

    // Crear el evento con el primer alumno asignado
    const primaryUserId = targetUserIds[0];
    const event = await calendarRepository.create({
      userId: primaryUserId,
      title,
      eventDate: parsedDate.toISOString(),
      type: type.toUpperCase(),
      status: status.toUpperCase(),
      notes,
      meetUrl,
    });

    // Si hay múltiples alumnos, registrarlos en calendar_event_attendees
    if (targetUserIds.length > 1) {
      for (let i = 1; i < targetUserIds.length; i++) {
        await calendarRepository.addAttendee(event.id, targetUserIds[i]);
      }
    }

    return event;
  },

  async updateEvent(id, { title, eventDate, type, status, notes, meetUrl }) {
    const event = await calendarRepository.findById(id);
    if (!event) {
      const error = new Error('Evento no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    if (type && !ALLOWED_TYPES.includes(type.toUpperCase())) {
      const error = new Error(`Tipo de evento inválido. Valores permitidos: [${ALLOWED_TYPES.join(', ')}].`);
      error.statusCode = 400;
      throw error;
    }

    if (status && !ALLOWED_STATUSES.includes(status.toUpperCase())) {
      const error = new Error(`Estado inválido. Valores permitidos: [${ALLOWED_STATUSES.join(', ')}].`);
      error.statusCode = 400;
      throw error;
    }

    let isoDate;
    if (eventDate) {
      const parsed = new Date(eventDate);
      if (isNaN(parsed.getTime())) {
        const error = new Error('La fecha del evento es inválida.');
        error.statusCode = 400;
        throw error;
      }
      isoDate = parsed.toISOString();
    }

    return calendarRepository.update(id, {
      title,
      eventDate: isoDate,
      type,
      status,
      notes,
      meetUrl,
    });
  },

  async getMyEvents(userId, filters) {
    return calendarRepository.findByUserId(userId, filters);
  },

  async getAllEvents(filters) {
    return calendarRepository.findAll(filters);
  },

  async updateEventStatus(id, newStatus, requestingUser) {
    if (!newStatus || typeof newStatus !== 'string' || !ALLOWED_STATUSES.includes(newStatus.toUpperCase())) {
      const error = new Error(`Estado inválido. Valores permitidos: [${ALLOWED_STATUSES.join(', ')}].`);
      error.statusCode = 400;
      throw error;
    }

    const event = await calendarRepository.findById(id);
    if (!event) {
      const error = new Error('Evento no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // Si es Alumno, solo puede actualizar eventos propios o a los que fue invitado
    if (requestingUser.role === 'ALUMNO' && event.user_id !== requestingUser.id) {
      const isAttendee = await calendarRepository.isAttendee(id, requestingUser.id);
      if (!isAttendee) {
        const error = new Error('No tienes permisos para modificar este evento.');
        error.statusCode = 403;
        throw error;
      }
    }

    return calendarRepository.updateStatus(id, newStatus);
  },

  async deleteEvent(id) {
    const deleted = await calendarRepository.delete(id);
    if (!deleted) {
      const error = new Error('Evento no encontrado o ya eliminado.');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  },
};
