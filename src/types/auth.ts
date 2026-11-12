export type UserRole = 'PRODUCER' | 'TECHNICIAN' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface SignInInput { email: string; password: string }
export interface SignUpInput extends SignInInput { name: string }

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: AuthUser;
}

export interface Session {
  token: string;
  tokenType: 'Bearer';
  expiresAt: string | null;
  user: AuthUser;
}
