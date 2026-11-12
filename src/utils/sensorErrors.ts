import { isAxiosError } from 'axios';
import { parseApiError } from './errors';
import { classifySensorConflict } from './sensorConflicts';

export const isSensorNotFound = (error: unknown) => isAxiosError(error) && error.response?.status === 404;
export function sensorConflict(error: unknown) {
  return isAxiosError<unknown>(error) && error.response?.status === 409 ? classifySensorConflict(error.response.data) : undefined;
}
export function parseSensorError(error: unknown, operation: 'load' | 'save' | 'delete' = 'load'): string {
  if (isSensorNotFound(error)) return 'Sensor não encontrado ou indisponível.';
  const conflict = sensorConflict(error);
  if (operation === 'save' && conflict === 'duplicate-code') return 'Código de dispositivo já cadastrado. Informe outro código; a unicidade vale para todo o sistema.';
  if (operation === 'delete' && conflict === 'linked-readings') return 'Este sensor possui leituras vinculadas e não pode ser excluído. Nenhuma leitura será removida automaticamente.';
  if (conflict !== undefined) return 'Não foi possível concluir a operação por um conflito de integridade. Verifique os dados e tente novamente.';
  return parseApiError(error);
}
