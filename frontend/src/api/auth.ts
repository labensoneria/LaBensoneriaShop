import { apiFetch } from './client';
import type { AuthUser, LoginResponse, RegisterPayload, UpdateProfilePayload } from '../types';

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: RegisterPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me');
}

export function updateProfile(data: UpdateProfilePayload): Promise<AuthUser> {
  return apiFetch<AuthUser>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
