import type { CropAreaStatus } from '../types/cropArea';

const statusLabels: Record<CropAreaStatus, string> = {
  NORMAL: 'Normal', ATTENTION: 'Atenção', CRITICAL: 'Crítico', ARCHIVED: 'Arquivado',
};
export function formatCropAreaStatus(status: CropAreaStatus): string {
  return statusLabels[status] ?? 'Status indisponível';
}

export function formatCropAreaDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatCoordinate(value: number | null): string {
  return value === null ? 'Não informada' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(value);
}
