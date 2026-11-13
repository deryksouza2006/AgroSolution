import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardCropSummary } from '../../types/dashboard';
import { formatDashboardDate, formatDashboardMetric, formatDashboardSource } from '../../utils/dashboardFormatting';
import { DashboardCard } from './DashboardCard';
import { DashboardDataNotice, DashboardStatusBadge } from './DashboardBadges';

export function DashboardCropCard({ summary, name, onPress }: { summary: DashboardCropSummary; name: string; onPress?: () => void }) {
  const { theme } = useTheme();
  const metrics = [
    ['Disponibilidade hídrica', formatDashboardMetric(summary.waterAvailabilityPercent, '%')],
    ['VPD', formatDashboardMetric(summary.vpdKpa, 'kPa')],
    ['Variação de umidade por hora', formatDashboardMetric(summary.moistureChangePerHour, '/h')],
  ];
  return <DashboardCard title={name} onPress={onPress}>
    <DashboardStatusBadge kind="risk" value={summary.riskLevel} />
    <DashboardDataNotice data={summary} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg }}>
      {metrics.map(([label, value]) => <View key={label} style={{ flexGrow: 1, flexBasis: 140, gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{value}</Text>
      </View>)}
    </View>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Última medição: {formatDashboardDate(summary.measuredAt)}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Origem: {formatDashboardSource(summary.source)}</Text>
  </DashboardCard>;
}
