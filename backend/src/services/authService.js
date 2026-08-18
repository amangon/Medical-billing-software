import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function generateTokens(user) {
  const accessToken = jwt.sign({ userId: user.id, businessId: user.businessId }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export async function register(userData) {
  try {
    const { email, password, businessName, name, phone, ...rest } = userData;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        business: {
          create: {
            name: businessName,
            email,
            phone: phone || '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            ...rest
          }
        }
      },
      include: { business: true }
    });
    const { accessToken, refreshToken } = generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  } catch (err) {
    throw err;
  }
}

export async function login(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const { accessToken, refreshToken } = generateTokens(user);
    const { password: __, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, accessToken, refreshToken };
  } catch (err) {
    throw err;
  }
}

export async function forgotPassword(email) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 3600000)
      }
    });

    await sendPasswordResetEmail(user.email, user.name, token);
    return { message: 'Reset email sent' };
  } catch (err) {
    throw err;
  }
}

export async function verifyOTP(phone, otp) {
  try {
    const user = await prisma.user.findFirst({ where: { phone } });
    if (!user) throw new Error('Invalid OTP');
    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    return { message: 'Verified' };
  } catch (err) {
    throw err;
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } }
    });
    if (!user) throw new Error('Invalid token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null }
    });
    return { message: 'Password updated' };
  } catch (err) {
    throw err;
  }
}

export async function verifyEmail(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new Error('Invalid or expired token');
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });
    return { message: 'Email verified' };
  } catch (err) {
    throw err;
  }
}

export async function refreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new Error('Invalid token');
    return generateTokens(user);
  } catch (err) {
    throw err;
  }
}

export async function getMe(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (err) {
    throw err;
  }
}
