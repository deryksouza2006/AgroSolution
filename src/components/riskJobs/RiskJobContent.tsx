import { Text } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJob } from '../../types/riskJob';
import { formatRiskDate, formatRiskJobStatus } from '../../utils/riskJobFormatting';
import { DashboardCard } from '../dashboard/DashboardCard';
import { DashboardStatusBadge } from '../dashboard/DashboardBadges';
import { RiskDemoNotice } from './RiskBadges';
import { RiskResultSection } from './RiskResultSection';
import { RiskAlertSection } from './RiskAlertSection';
import { RiskMeasurementsSection } from './RiskMeasurementsSection';
import { RiskRainfallSection } from './RiskRainfallSection';

export function RiskJobContent({ job, children }: PropsWithChildren<{ job: RiskJob }>) {
  const { theme } = useTheme();
  return <>
    <DashboardCard title={job.id === null ? 'Análise' : `Análise #${job.id}`}>
      {job.status !== null ? <DashboardStatusBadge kind="job" value={job.status} /> : <Text style={[theme.typography.label, { color: theme.colors.text }]}>Processamento: {formatRiskJobStatus(null)}</Text>}
      <RiskDemoNotice demo={job.demo} />
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>Talhão: {job.cropAreaId === null ? 'Sem dados' : `#${job.cropAreaId}`}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Criado em: {formatRiskDate(job.createdAt)}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Concluído em: {formatRiskDate(job.completedAt)}</Text>
      {job.errorMessage && <Text accessibilityRole="alert" style={[theme.typography.body, { color: theme.colors.text }]}>{job.errorMessage}</Text>}
    </DashboardCard>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Indicadores determinísticos fornecidos pelo servidor. Este resultado não é uma prescrição nem um diagnóstico agronômico.</Text>
    <RiskResultSection result={job.result} />
    {children}
    <RiskAlertSection job={job} />
    <RiskMeasurementsSection measurements={job.measurements} />
    <RiskRainfallSection rainfall={job.rainfall} />
  </>;
}
