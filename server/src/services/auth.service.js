import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { signToken } from '../utils/jwt.util.js';

export const authService = {
  async register({ firstName, lastName, email, password, phone }) {
    if (!firstName || !lastName || !email || !password) {
      const error = new Error('Nombre, apellido, email y contraseña son obligatorios.');
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error('El formato del correo electrónico es inválido.');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 6) {
      const error = new Error('La contraseña debe tener al menos 6 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('Ya existe una cuenta registrada con este correo electrónico.');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await userRepository.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'ALUMNO', // Registro público siempre crea alumnos por seguridad
      phone,
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: newUser,
      token,
    };
  },

  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Debe ingresar correo electrónico y contraseña.');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      const error = new Error('Credenciales inválidas.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.is_active) {
      const error = new Error('Esta cuenta ha sido desactivada. Comuníquese con el administrador.');
      error.statusCode = 403;
      throw error;
    }

    // La contraseña SIEMPRE se valida contra el hash almacenado
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const error = new Error('Credenciales inválidas.');
      error.statusCode = 401;
      throw error;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { password_hash, ...publicUser } = user;

    return {
      user: publicUser,
      token,
    };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Usuario no encontrado.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      const error = new Error('La contraseña actual y la nueva contraseña son obligatorias.');
      error.statusCode = 400;
      throw error;
    }

    if (String(newPassword).length < 6) {
      const error = new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      error.statusCode = 400;
      throw error;
    }

    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      const error = new Error('Usuario no encontrado.');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      const error = new Error('La contraseña actual es incorrecta.');
      error.statusCode = 400;
      throw error;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, newHash);
    return true;
  },
};

