import { paymentRepository } from '../repositories/payment.repository.js';
import { userRepository } from '../repositories/user.repository.js';

export const paymentService = {
  async getAllPayments(filters) {
    return paymentRepository.findAll(filters);
  },

  async getPaymentById(id) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      const error = new Error('Pago no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return payment;
  },

  async registerPayment(paymentData) {
    const { userId, amount } = paymentData;
    if (!userId) {
      const error = new Error('El ID de cliente es obligatorio.');
      error.statusCode = 400;
      throw error;
    }
    if (!amount || Number(amount) <= 0) {
      const error = new Error('El monto debe ser mayor a 0.');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('El cliente especificado no existe.');
      error.statusCode = 404;
      throw error;
    }

    return paymentRepository.create(paymentData);
  },

  async deletePayment(id) {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      const error = new Error('Pago no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return paymentRepository.delete(id);
  }
};
