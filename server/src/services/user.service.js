import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';

export const userService = {
  async getAllUsers(filters) {
    return userRepository.findAll(filters);
  },

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error('Cliente o usuario no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  async createUserByAdmin(data) {
    const firstName = data.firstName || data.first_name;
    const lastName = data.lastName !== undefined ? data.lastName : (data.last_name || '');
    const email = data.email || null;
    const password = data.password || null;
    const role = data.role || 'ALUMNO';
    const phone = data.phone || null;
    const trainerId = data.trainerId || data.trainer_id || null;
    const accountStatus = data.accountStatus || data.account_status || 'ACTIVO';
    const goals = data.goals || null;
    const birthDate = data.birthDate || data.birth_date || null;
    const isPresencial = data.isPresencial !== undefined ? data.isPresencial : (data.is_presencial !== undefined ? data.is_presencial : 1);
    const isOnline = data.isOnline !== undefined ? data.isOnline : (data.is_online !== undefined ? data.is_online : 0);
    const planName = data.planName || data.plan_name || 'Pase Libre';
    const monthlyPrice = data.monthlyPrice !== undefined ? data.monthlyPrice : (data.monthly_price !== undefined ? data.monthly_price : 0);
    const dueDate = data.dueDate || data.due_date || null;
    const scheduleDays = data.scheduleDays || data.schedule_days || '[1,2,3,4,5]';
    const scheduleTime = data.scheduleTime || data.schedule_time || '09:00';
    const enrollmentDate = data.enrollmentDate || data.enrollment_date || null;
    const notes = data.notes || '';

    if (!firstName || !firstName.trim()) {
      const error = new Error('El nombre del cliente es obligatorio.');
      error.statusCode = 400;
      throw error;
    }

    let passwordHash = null;

    // Si tiene email, validar formato y unicidad
    if (email && email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
        const error = new Error('El formato del correo electrónico es inválido.');
        error.statusCode = 400;
        throw error;
      }

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        const error = new Error('Ya existe un cliente con este correo electrónico.');
        error.statusCode = 409;
        throw error;
      }
    }

    // Si tiene acceso online o rol ADMIN, debe tener contraseña
    if (isOnline || role === 'ADMIN') {
      const pwd = password && password.trim() ? password.trim() : 'ZGym' + Math.floor(1000 + Math.random() * 9000);
      if (pwd.length < 6) {
        const error = new Error('La contraseña debe tener al menos 6 caracteres.');
        error.statusCode = 400;
        throw error;
      }
      passwordHash = await bcrypt.hash(pwd, 10);
    } else if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    return userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : '',
      email: email && email.trim() ? email.trim() : null,
      passwordHash,
      role: ['ADMIN', 'ENTRENADOR', 'ALUMNO'].includes(role) ? role : 'ALUMNO',
      phone: phone ? phone.trim() : null,
      trainerId,
      accountStatus,
      goals,
      birthDate,
      isPresencial: isPresencial ? 1 : 0,
      isOnline: isOnline ? 1 : 0,
      planName: planName || 'Pase Libre',
      monthlyPrice: Number(monthlyPrice) || 0,
      dueDate,
      scheduleDays,
      scheduleTime,
      enrollmentDate,
      notes
    });
  },

  async updateUser(id, updateData, requestingUserId) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      const error = new Error('Cliente no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    // Evitar que el administrador se bloquee a sí mismo
    if (requestingUserId && Number(id) === Number(requestingUserId)) {
      if (updateData.isActive === false || (updateData.role && updateData.role !== 'ADMIN')) {
        const error = new Error('No puedes desactivar tu propia cuenta ni quitarte el rol de administrador.');
        error.statusCode = 400;
        throw error;
      }
    }

    return userRepository.update(id, updateData);
  },

  async deleteUser(id, requestingUserId) {
    if (requestingUserId && Number(id) === Number(requestingUserId)) {
      const error = new Error('No puedes eliminar tu propia cuenta de administrador.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await userRepository.findById(id);
    if (!existing) {
      const error = new Error('Cliente no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return userRepository.delete(id);
  },
};
