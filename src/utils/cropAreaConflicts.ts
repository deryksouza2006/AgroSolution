export type CropAreaDeleteConflict = 'sensors' | 'history' | 'unknown';

export function classifyCropAreaDeleteConflict(data: unknown): CropAreaDeleteConflict {
  if (typeof data !== 'object' || data === null || !('message' in data)) return 'unknown';
  if (data.message === 'Não é possível excluir área de cultivo com sensores vinculados') return 'sensors';
  if (data.message === 'Cultivo com histórico deve ser arquivado') return 'history';
  return 'unknown';
}

export function isCropAreaCapacityConflict(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || !('message' in data) || typeof data.message !== 'string') return false;
  const message = data.message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /area|capacidade/.test(message) && /exced|ultrapass|insuficien|superior|maior|limite/.test(message);
}
