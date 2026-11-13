import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardReading } from '../../types/dashboard';
import { formatDashboardDate, formatDashboardSource } from '../../utils/dashboardFormatting';
import { ReadingMeasurements } from '../readings/ReadingMeasurements';
import { DashboardCard } from './DashboardCard';
import { DashboardDataNotice } from './DashboardBadges';

export function DashboardReadingCard({ reading, onPress }: { reading: DashboardReading; onPress?: () => void }) {
  const { theme } = useTheme();
  return <DashboardCard title={reading.sensorName ?? 'Sensor não informado'} onPress={onPress} actionLabel="Ver leitura">
    <DashboardDataNotice data={reading} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Medição: {formatDashboardDate(reading.measuredAt)}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{reading.cropAreaName ?? 'Talhão não informado'} · {reading.farmName ?? 'Propriedade não informada'}</Text>
    <ReadingMeasurements reading={reading} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Origem: {formatDashboardSource(reading.source)}</Text>
  </DashboardCard>;
}
