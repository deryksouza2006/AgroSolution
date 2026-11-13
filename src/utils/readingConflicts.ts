export type ReadingConflict = 'archived' | 'inactive' | 'analyzed' | 'unknown';
export function classifyReadingConflict(data: unknown): ReadingConflict {
  if (typeof data !== 'object' || data === null || !('message' in data)) return 'unknown';
  switch (data.message) {
    case 'Cultivo arquivado': return 'archived';
    case 'Somente sensores ACTIVE podem registrar leituras': return 'inactive';
    case 'Leituras ANALYZED não podem ser excluídas': return 'analyzed';
    default: return 'unknown';
  }
}
export const isLatestReadingEmptyStatus = (status: number | undefined) => status === 404;
