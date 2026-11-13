import { isAxiosError } from 'axios';
import { parseApiError } from './errors';
import { classifyReadingConflict } from './readingConflicts';

export const isReadingNotFound = (error: unknown) => isAxiosError(error) && error.response?.status === 404;
export function readingConflict(error: unknown) {
  return isAxiosError<unknown>(error) && error.response?.status === 409 ? classifyReadingConflict(error.response.data) : undefined;
}
export function parseReadingError(error: unknown): string {
  switch (readingConflict(error)) {
    case 'archived': return 'O talhão está arquivado. Reative-o nos detalhes antes de registrar leituras.';
    case 'inactive': return 'Somente sensores ativos podem registrar leituras. Verifique o status nos detalhes do sensor.';
    case 'analyzed': return 'Esta leitura já foi processada (ANALYZED) e não pode ser excluída.';
    case 'unknown': return 'Não foi possível concluir a operação por um conflito. Atualize os dados e tente novamente.';
  }
  if (isReadingNotFound(error)) return 'Leitura não encontrada ou indisponível.';
  return parseApiError(error);
}
