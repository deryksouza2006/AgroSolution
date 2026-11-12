import type { ActivityType } from '../types/activity';

const labels: Record<ActivityType, string> = {
  IRRIGATION: 'Irrigação', FERTILIZATION: 'Fertilização', PLANTING: 'Plantio', HARVEST: 'Colheita',
};
export function formatActivityType(type: ActivityType): string {
  return labels[type] ?? 'Tipo indisponível';
}
export function formatActivityQuantity(quantity: number | null, unit: string | null): string {
  if (quantity === null || !unit) return 'Não informada';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(quantity)} ${unit}`;
}
