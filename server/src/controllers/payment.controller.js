import { paymentService } from '../services/payment.service.js';

export const paymentController = {
  async getAll(req, res, next) {
    try {
      const { userId, month, search } = req.query;
      const payments = await paymentService.getAllPayments({ userId, month, search });
      res.status(200).json({
        success: true,
        data: { payments }
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);
      res.status(200).json({
        success: true,
        data: { payment }
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const payment = await paymentService.registerPayment(req.body);
      res.status(201).json({
        success: true,
        message: 'Pago registrado exitosamente.',
        data: { payment }
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await paymentService.deletePayment(id);
      res.status(200).json({
        success: true,
        message: 'Registro de pago eliminado.'
      });
    } catch (error) {
      next(error);
    }
  }
};
