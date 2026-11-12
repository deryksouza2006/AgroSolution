import { isAxiosError } from 'axios';
import { parseApiError } from './errors';

export function isArchivedActivityError(error: unknown): boolean {
  if (!isAxiosError<unknown>(error) || error.response?.status !== 409) return false;
  const data = error.response.data;
  return typeof data === 'object' && data !== null && 'message' in data
    && data.message === 'Cultivo arquivado: reative antes de alterar atividades';
}
export function isActivityNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
export function parseActivityError(error: unknown): string {
  if (isArchivedActivityError(error)) return 'Este talhão está arquivado. Consulte o diário em modo somente leitura e reative o talhão nos detalhes antes de alterar atividades.';
  if (isActivityNotFound(error)) return 'Atividade não encontrada ou indisponível.';
  return parseApiError(error);
}
