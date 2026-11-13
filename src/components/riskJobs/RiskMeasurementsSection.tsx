import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskMeasurement } from '../../types/riskJob';
import { formatRiskDate, formatRiskMetric } from '../../utils/riskJobFormatting';
import { DashboardCard } from '../dashboard/DashboardCard';
import { MeasurementOriginBadge } from './RiskBadges';

export function RiskMeasurementsSection({ measurements }: { measurements: RiskMeasurement[] }) {
  const { theme } = useTheme();
  if (!measurements.length) return null;
  return <View style={{ gap: theme.spacing.lg }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Snapshots das medições</Text>
    {measurements.map((measurement, index) => <DashboardCard key={`${measurement.id}-${index}`} title={measurement.id === null ? 'Medição sem identificador' : `Medição #${measurement.id}`}>
      <MeasurementOriginBadge simulated={measurement.simulated} />
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Sensor: {measurement.sensorId === null ? 'Sem dados' : `#${measurement.sensorId}`}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{formatRiskDate(measurement.measuredAt)}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Umidade do solo: {formatRiskMetric(measurement.soilMoisture, '%')}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Temperatura do ar: {formatRiskMetric(measurement.airTemperature, '°C')}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Umidade do ar: {formatRiskMetric(measurement.airHumidity, '%')}</Text>
    </DashboardCard>)}
  </View>;
}
