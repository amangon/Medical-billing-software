import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  register as registerService,
  login as loginService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  verifyOTP as verifyOTPService,
  refreshToken as refreshTokenService,
  getMe as getMeService
} from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, name, businessName } = req.body;
    const result = await registerService({ email, password, name, businessName });
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOTPService(email, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPasswordService(token, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isVerified: true }
    });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await refreshTokenService(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getMeService(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null }
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
