import { isAxiosError } from 'axios';
import { parseApiError } from './errors';

export const isRiskJobNotFound = (error: unknown) => isAxiosError(error) && error.response?.status === 404;
export function parseRiskJobError(error: unknown): string {
  if (isRiskJobNotFound(error)) return 'Análise ou alerta não encontrado ou indisponível.';
  return parseApiError(error);
}
