import { isAxiosError } from 'axios';
import { parseApiError } from './errors';
import { classifyCropAreaDeleteConflict, isCropAreaCapacityConflict } from './cropAreaConflicts';

export function isCropAreaNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

export function cropAreaDeleteConflict(error: unknown) {
  return isAxiosError<unknown>(error) && error.response?.status === 409
    ? classifyCropAreaDeleteConflict(error.response.data) : undefined;
}

export function parseCropAreaError(error: unknown, operation: 'load' | 'save' | 'delete' | 'archive' | 'reactivate' = 'load'): string {
  if (isCropAreaNotFound(error)) return 'Talhão não encontrado ou indisponível.';
  if (isAxiosError(error) && error.response?.status === 409) {
    if ((operation === 'save' || operation === 'reactivate') && isCropAreaCapacityConflict(error.response.data)) return 'A soma das áreas dos talhões ultrapassa a área da propriedade. Reduza a área ou selecione outra propriedade com capacidade disponível.';
    if (operation === 'delete') {
      const conflict = cropAreaDeleteConflict(error);
      if (conflict === 'sensors') return 'O talhão possui sensores vinculados. Os sensores precisam ser excluídos antes de excluir o talhão.';
      if (conflict === 'history') return 'Este cultivo possui histórico e deve ser arquivado. Você pode arquivá-lo após confirmar a ação.';
    }
    return 'Não foi possível concluir a operação por um conflito de integridade. Verifique os vínculos e tente novamente.';
  }
  return parseApiError(error);
}
