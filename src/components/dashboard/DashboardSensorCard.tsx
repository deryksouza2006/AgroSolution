import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardSensorIssue } from '../../types/dashboard';
import { formatDashboardDate } from '../../utils/dashboardFormatting';
import { formatSensorStatus } from '../../utils/sensorFormatting';
import { isSensorStatus } from '../../utils/sensorValidation';
import { DashboardCard } from './DashboardCard';
import { DashboardDataNotice } from './DashboardBadges';

export function DashboardSensorCard({ sensor, cropName, onPress }: { sensor: DashboardSensorIssue; cropName: string; onPress?: () => void }) {
  const { theme } = useTheme();
  return <DashboardCard title={sensor.name ?? 'Sensor sem nome informado'} onPress={onPress} actionLabel="Ver sensor">
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
      <Ionicons name="alert-circle-outline" size={24} color={theme.colors.warning} accessible={false} />
      <Text style={[theme.typography.label, { color: theme.colors.text, flexShrink: 1 }]}>Problema informado pelo servidor</Text>
    </View>
    <DashboardDataNotice data={sensor} />
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{cropName}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Status administrativo: {sensor.status && isSensorStatus(sensor.status) ? formatSensorStatus(sensor.status) : 'Não informado'}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Última medição: {formatDashboardDate(sensor.lastMeasuredAt)}</Text>
  </DashboardCard>;
}
