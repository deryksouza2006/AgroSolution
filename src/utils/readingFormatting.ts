import type { MeasurementField, Reading, ReadingScope, ReadingSource } from '../types/reading';

export const readingMeasurementLabels: Record<MeasurementField, string> = {
  temperatureCelsius: 'Temperatura', airHumidityPercent: 'Umidade do ar', soilMoisturePercent: 'Umidade do solo', batteryPercent: 'Bateria', rainfallMillimeters: 'Chuva',
};
export const readingMeasurementUnits: Record<MeasurementField, string> = {
  temperatureCelsius: '°C', airHumidityPercent: '%', soilMoisturePercent: '%', batteryPercent: '%', rainfallMillimeters: 'mm',
};
export function formatReadingValue(value: number | null, field: MeasurementField): string {
  return value === null || !Number.isFinite(value) ? 'Não informada' : `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value)} ${readingMeasurementUnits[field]}`;
}
export function formatReadingSource(source: ReadingSource): string {
  return ({ MANUAL: 'Manual', DEVICE: 'Dispositivo IoT', SIMULATED: 'Simulada' } as const)[source] ?? 'Origem indisponível';
}
export function isSimulatedReading(reading: Pick<Reading, 'source'>): boolean { return reading.source === 'SIMULATED'; }
export function formatReadingAnalysisStatus(status: string): string {
  if (status === 'ANALYZED') return 'Processamento concluído';
  if (status === 'PENDING_PUBLICATION') return 'Aguardando publicação';
  return 'Estado técnico não reconhecido';
}
export function readingScopeTitle(scope: ReadingScope): string {
  if (scope.kind === 'sensor') return `Leituras de ${scope.sensorName ?? 'seu sensor'}`;
  if (scope.kind === 'cropArea') return `Leituras de ${scope.cropAreaName ?? 'seu talhão'}`;
  return 'Todas as leituras';
}
