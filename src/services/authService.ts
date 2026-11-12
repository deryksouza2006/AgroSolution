import type { AuthResponse, AuthUser, SignInInput, SignUpInput } from '../types/auth';
import { AppError } from '../utils/errors';
import { api } from './api';

function isUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'number'
    && 'name' in value && typeof value.name === 'string'
    && 'email' in value && typeof value.email === 'string'
    && 'role' in value && ['PRODUCER', 'TECHNICIAN', 'ADMIN'].includes(String(value.role));
}

function parseSession(value: AuthResponse): AuthResponse {
  if (!value || typeof value.token !== 'string' || !value.token.trim()
    || value.tokenType !== 'Bearer' || !Number.isFinite(Date.parse(value.expiresAt)) || !isUser(value.user)) {
    throw new AppError('O servidor retornou uma sessão inválida. Tente novamente.');
  }
  return value;
}

export const authService = {
  async signIn({ email, password }: SignInInput, signal: AbortSignal): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email: email.trim(), password }, { signal, headers: { Authorization: false } });
    return parseSession(data);
  },
  async signUp({ name, email, password }: SignUpInput, signal: AbortSignal): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { name: name.trim(), email: email.trim(), password }, { signal, headers: { Authorization: false } });
    return parseSession(data);
  },
  async me(signal: AbortSignal): Promise<AuthUser> {
    const { data } = await api.get<unknown>('/api/auth/me', { signal });
    if (!isUser(data)) throw new AppError('Não foi possível validar os dados da sua conta. Tente novamente.');
    return data;
  },
};
