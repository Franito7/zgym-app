import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const signToken = (payload) => {
  return jwt.sign(payload, ENV.JWT.SECRET, {
    expiresIn: ENV.JWT.EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, ENV.JWT.SECRET);
  } catch (error) {
    return null;
  }
};
