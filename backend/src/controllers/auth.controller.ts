import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

const addressSchema = z.object({
  addressName:    z.string().optional(),
  addressStreet:  z.string().optional(),
  addressStreet2: z.string().optional(),
  addressCity:    z.string().optional(),
  addressPostal:  z.string().optional(),
  addressCountry: z.string().optional(),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1),
}).merge(addressSchema);

const updateProfileSchema = z.object({
  name:  z.string().nullable().optional(),
  email: z.string().email().optional(),
}).merge(
  z.object({
    addressName:    z.string().nullable().optional(),
    addressStreet:  z.string().nullable().optional(),
    addressStreet2: z.string().nullable().optional(),
    addressCity:    z.string().nullable().optional(),
    addressPostal:  z.string().nullable().optional(),
    addressCountry: z.string().nullable().optional(),
  })
);

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);
    res.json(await authService.login(email, password));
  } catch (err) {
    next(err);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await authService.getMe(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    res.json(await authService.updateProfile(req.user!.userId, data));
  } catch (err) {
    next(err);
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(6),
});

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);
    // Always 200 — never reveal whether the email exists
    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    next(err);
  }
}
