import type { SensorCalculatedHealth, SensorCommunicationStatus, SensorHealth, SensorStatus, SensorType } from '../types/sensor';

const typeLabels: Record<SensorType, string> = { SOIL_MOISTURE: 'Umidade do solo', TEMPERATURE: 'Temperatura', HUMIDITY: 'Umidade do ar', WEATHER_STATION: 'Estação meteorológica' };
const statusLabels: Record<SensorStatus, string> = { ACTIVE: 'Ativo', INACTIVE: 'Inativo', FAULT: 'Falha', MAINTENANCE: 'Manutenção' };
const communicationLabels: Record<SensorCommunicationStatus, string> = { RECENT: 'Comunicação recente', STALE: 'Comunicação desatualizada', OFFLINE: 'Offline', INVALID_TIMESTAMP: 'Data/hora inválida' };
const healthLabels: Record<SensorCalculatedHealth, string> = { HEALTHY: 'Saudável', STALE: 'Dados desatualizados', OFFLINE: 'Offline', POSSIBLE_FAULT: 'Possível falha', INSUFFICIENT_DATA: 'Dados insuficientes' };
export const formatSensorType = (value: SensorType) => typeLabels[value] ?? 'Tipo indisponível';
export const formatSensorStatus = (value: SensorStatus | null) => value ? statusLabels[value] ?? 'Status indisponível' : 'Status não informado';
export const formatSensorCommunication = (value: SensorCommunicationStatus | null) => value ? communicationLabels[value] ?? 'Comunicação indisponível' : 'Comunicação não informada';
export const formatSensorHealth = (value: SensorCalculatedHealth | null) => value ? healthLabels[value] ?? 'Saúde indisponível' : 'Saúde não informada';
export function interpretSensorHealth(health: SensorHealth) {
  return {
    administrativeStatus: formatSensorStatus(health.administrativeStatus),
    communication: formatSensorCommunication(health.communicationStatus),
    calculatedHealth: formatSensorHealth(health.calculatedHealth),
    lastMeasuredAt: health.lastMeasuredAt ?? null,
    ageSeconds: health.ageSeconds !== null && Number.isFinite(health.ageSeconds) && health.ageSeconds >= 0 ? health.ageSeconds : null,
    battery: health.batteryPercent !== null && Number.isFinite(health.batteryPercent) && health.batteryPercent >= 0 && health.batteryPercent <= 100
      ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(health.batteryPercent)}%` : 'Não informada',
    calibratedAt: health.calibratedAt ?? null,
    maintenanceNote: health.maintenanceNote?.trim() || 'Não informada',
    policy: health.policy?.trim() || 'Política demonstrativa não informada',
  };
}
