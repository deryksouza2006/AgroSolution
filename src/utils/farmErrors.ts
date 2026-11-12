import axios from 'axios';
import { parseApiError } from './errors';

export function isFarmNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function parseFarmError(error: unknown, deleting = false): string {
  if (isFarmNotFound(error)) return 'Propriedade não encontrada ou indisponível.';
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    return deleting
      ? 'A propriedade não pode ser excluída porque existem talhões vinculados. Remova os vínculos antes de tentar novamente.'
      : 'Não foi possível salvar por um conflito de integridade. Verifique os dados e tente novamente.';
  }
  return parseApiError(error);
}
