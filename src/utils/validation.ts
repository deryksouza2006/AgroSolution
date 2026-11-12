import type { SignUpInput } from '../types/auth';

export type AuthFormErrors = Partial<Record<keyof SignUpInput | 'confirmPassword', string>>;

export function validateAuthForm(input: SignUpInput, registering: boolean, confirmation: string): AuthFormErrors {
  const errors: AuthFormErrors = {};
  if (registering && !input.name.trim()) errors.name = 'Informe seu nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Informe um e-mail válido.';
  if (input.password.length < 8 || input.password.length > 72) errors.password = 'A senha deve ter entre 8 e 72 caracteres.';
  if (registering && input.password !== confirmation) errors.confirmPassword = 'As senhas devem ser iguais.';
  return errors;
}
