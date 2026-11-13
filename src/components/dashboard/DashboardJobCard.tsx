import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardJob } from '../../types/dashboard';
import { formatDashboardDate } from '../../utils/dashboardFormatting';
import { DashboardCard } from './DashboardCard';
import { DashboardDataNotice, DashboardStatusBadge } from './DashboardBadges';

export function DashboardJobCard({ job, cropName, alert = false, onPress }: { job: DashboardJob; cropName: string; alert?: boolean; onPress?: () => void }) {
  const { theme } = useTheme();
  return <DashboardCard title={alert ? `Alerta · ${cropName}` : cropName} onPress={onPress}>
    <DashboardStatusBadge kind="job" value={job.status} />
    <DashboardDataNotice data={job} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Criado em: {formatDashboardDate(job.createdAt)}</Text>
    {job.status === 'FAILED' && <Text style={[theme.typography.body, { color: theme.colors.text }]}>O servidor informou falha neste processamento.</Text>}
  </DashboardCard>;
}
