import type { CropAreaStatus } from '../types/cropArea';

const statusLabels: Record<CropAreaStatus, string> = {
  NORMAL: 'Normal', ATTENTION: 'Atenção', CRITICAL: 'Crítico', ARCHIVED: 'Arquivado',
};
export function formatCropAreaStatus(status: CropAreaStatus): string {
  return Object.hasOwn(statusLabels, status) ? statusLabels[status] : 'Status indisponível';
}

export function formatCropAreaDate(value: string | null | undefined): string {
  if (typeof value !== 'string' || !value.trim()) return 'Data indisponível';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatCoordinate(value: number | null | undefined): string {
  return typeof value !== 'number' || !Number.isFinite(value) ? 'Não informada' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(value);
}
