export function classifySensorConflict(data: unknown): 'duplicate-code' | 'linked-readings' | 'unknown' {
  if (typeof data !== 'object' || data === null || !('message' in data)) return 'unknown';
  if (data.message === 'Código de dispositivo já cadastrado') return 'duplicate-code';
  if (data.message === 'Não é possível excluir sensor com leituras vinculadas') return 'linked-readings';
  return 'unknown';
}
