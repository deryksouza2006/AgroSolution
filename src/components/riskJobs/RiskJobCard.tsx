import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJob } from '../../types/riskJob';
import { formatRiskDate } from '../../utils/riskJobFormatting';
import { alertStatusOf } from '../../utils/riskJobPolicy';
import { DashboardCard } from '../dashboard/DashboardCard';
import { DashboardStatusBadge } from '../dashboard/DashboardBadges';
import { AlertStatusBadge, RiskBadge, RiskDemoNotice } from './RiskBadges';

export function RiskJobCard({ job, alert = false, onPress }: { job: RiskJob; alert?: boolean; onPress?: () => void }) {
  const { theme } = useTheme();
  const title = alert ? job.alert?.title ?? 'Alerta hídrico' : job.id === null ? 'Análise sem identificador' : `Análise #${job.id}`;
  return <DashboardCard title={title} actionLabel={alert ? 'Ver alerta' : 'Ver análise'} onPress={onPress}>
    <RiskBadge risk={job.result?.riskLevel ?? null} />
    {job.status === null ? <Text style={[theme.typography.label, { color: theme.colors.text }]}>Processamento: Sem dados</Text> : <DashboardStatusBadge kind="job" value={job.status} />}
    {alert && <AlertStatusBadge status={alertStatusOf(job)} />}
    <RiskDemoNotice demo={job.demo || job.result?.demo === true || job.alert?.demo === true} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Talhão: {job.cropAreaId === null ? 'Sem dados' : `#${job.cropAreaId}`}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Criado em: {formatRiskDate(job.createdAt)}</Text>
  </DashboardCard>;
}
