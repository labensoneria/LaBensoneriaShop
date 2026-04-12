import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { sendPasswordResetEmail } from './email.service';

function signToken(payload: object): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  isAdmin: true,
  addressName: true,
  addressStreet: true,
  addressStreet2: true,
  addressCity: true,
  addressPostal: true,
  addressCountry: true,
};

export interface AddressFields {
  addressName?:    string | null;
  addressStreet?:  string | null;
  addressStreet2?: string | null;
  addressCity?:    string | null;
  addressPostal?:  string | null;
  addressCountry?: string | null;
}

export async function login(email: string, password: string) {
  const raw = await prisma.user.findUnique({ where: { email } });
  if (!raw || !raw.passwordHash) throw new AppError('Credenciales incorrectas', 401);

  const valid = await bcrypt.compare(password, raw.passwordHash);
  if (!valid) throw new AppError('Credenciales incorrectas', 401);

  const token = signToken({ userId: raw.id, isAdmin: raw.isAdmin });

  // Re-query with typed select so new fields are included once the client is regenerated
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: raw.id },
    select: USER_SELECT,
  });

  return { token, user };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...USER_SELECT, createdAt: true },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
}

export interface RegisterInput {
  email:          string;
  password:       string;
  name:           string;
  addressName?:   string;
  addressStreet?: string;
  addressStreet2?: string;
  addressCity?:   string;
  addressPostal?: string;
  addressCountry?: string;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('El email ya está registrado', 409);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const { email, name, addressName, addressStreet, addressStreet2, addressCity, addressPostal, addressCountry } = input;

  const user = await prisma.user.create({
    data: { email, passwordHash, name, addressName, addressStreet, addressStreet2, addressCity, addressPostal, addressCountry },
    select: USER_SELECT,
  });

  const token = signToken({ userId: user.id, isAdmin: user.isAdmin });
  return { token, user };
}

export interface UpdateProfileInput {
  name?:           string | null;
  email?:          string;
  addressName?:    string | null;
  addressStreet?:  string | null;
  addressStreet2?: string | null;
  addressCity?:    string | null;
  addressPostal?:  string | null;
  addressCountry?: string | null;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) throw new AppError('El email ya está en uso', 409);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: USER_SELECT,
  });
  return user;
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return silently — never reveal whether the email exists
  if (!user) return;

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data:  { used: true },
  });

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const resetUrl    = `${frontendUrl}/restablecer-contrasena?token=${token}`;

  await sendPasswordResetEmail(email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.used || record.expiresAt < new Date()) {
    throw new AppError('El enlace de restablecimiento no es válido o ha caducado', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data:  { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data:  { used: true },
    }),
  ]);
}
