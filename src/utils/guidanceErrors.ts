import { isAxiosError } from 'axios';
import { parseApiError } from './errors.ts';

export function guidanceFailureKind(error: unknown): 'conflict' | 'unavailable' | 'uncertain' {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 409) return 'conflict';
    if (status !== undefined && status >= 400 && status < 500) return 'unavailable';
  }
  return 'uncertain';
}
export function parseGuidanceError(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) return 'A análise ainda não terminou. Atualize o job antes de solicitar orientação.';
  if (isAxiosError(error) && error.response?.status === 404) return 'Esta análise está indisponível.';
  if (guidanceFailureKind(error) === 'uncertain') return 'Não foi possível confirmar o resultado da solicitação. A orientação pode ter sido salva no servidor. Use “Consultar atualização” antes de solicitar novamente.';
  return parseApiError(error);
}
