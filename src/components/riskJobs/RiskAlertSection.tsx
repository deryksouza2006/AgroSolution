import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJob } from '../../types/riskJob';
import { formatRiskDate, formatRiskRule } from '../../utils/riskJobFormatting';
import { alertStatusOf } from '../../utils/riskJobPolicy';
import { DashboardCard } from '../dashboard/DashboardCard';
import { AlertStatusBadge, RiskDemoNotice } from './RiskBadges';

export function RiskAlertSection({ job }: { job: RiskJob }) {
  const { theme } = useTheme();
  const alert = job.alert;
  const status = alertStatusOf(job);
  if (!alert && status === null) return null;
  const fields = [['Criado em', formatRiskDate(alert?.createdAt ?? null)], ['Reconhecido em', formatRiskDate(alert?.acknowledgedAt ?? null)],
    ['Reconhecido pelo usuário', alert?.acknowledgedBy === null || alert?.acknowledgedBy === undefined ? 'Sem dados' : `#${alert.acknowledgedBy}`],
    ['Resolvido em', formatRiskDate(alert?.resolvedAt ?? null)],
    ['Resolvido pelo usuário', alert?.resolvedBy === null || alert?.resolvedBy === undefined ? 'Sem dados' : `#${alert.resolvedBy}`]];
  return <DashboardCard title={alert?.title ?? 'Alerta associado'}>
    <AlertStatusBadge status={status} />
    <RiskDemoNotice demo={alert?.demo === true} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Reconhecer e resolver alteram apenas o estado administrativo do alerta. A classificação de risco permanece a informada no resultado.</Text>
    {alert?.justification && <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{alert.justification}</Text>}
    {alert?.rules.map((rule, index) => <Text key={index} style={[theme.typography.body, { color: theme.colors.text }]}>• {formatRiskRule(rule)}</Text>)}
    {fields.map(([label, value]) => <View key={label} style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
    </View>)}
  </DashboardCard>;
}
