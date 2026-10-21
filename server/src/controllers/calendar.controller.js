import { calendarService } from '../services/calendar.service.js';

export const calendarController = {
  async getMyEvents(req, res, next) {
    try {
      const { startDate, endDate, type } = req.query;
      const events = await calendarService.getMyEvents(req.user.id, {
        startDate,
        endDate,
        type,
      });
      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllEvents(req, res, next) {
    try {
      const { userId, startDate, endDate, type } = req.query;
      const events = await calendarService.getAllEvents({
        userId: userId ? parseInt(userId, 10) : undefined,
        startDate,
        endDate,
        type,
      });
      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { userId, userIds, title, eventDate, type, status, notes, meetUrl } = req.body;
      const event = await calendarService.createEvent({
        userId,
        userIds,
        title,
        eventDate,
        type,
        status,
        notes,
        meetUrl,
      });
      res.status(201).json({
        success: true,
        message: 'Evento de calendario programado exitosamente.',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { title, eventDate, type, status, notes, meetUrl } = req.body;
      const event = await calendarService.updateEvent(id, {
        title,
        eventDate,
        type,
        status,
        notes,
        meetUrl,
      });
      res.status(200).json({
        success: true,
        message: 'Evento de calendario actualizado exitosamente.',
        data: { event },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await calendarService.updateEventStatus(id, status, req.user);
      res.status(200).json({
        success: true,
        message: 'Estado del evento actualizado exitosamente.',
        data: { event: updated },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await calendarService.deleteEvent(id);
      res.status(200).json({
        success: true,
        message: 'Evento eliminado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },
};
