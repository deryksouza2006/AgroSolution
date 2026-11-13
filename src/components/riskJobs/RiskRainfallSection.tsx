import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJob } from '../../types/riskJob';
import { formatRiskMetric } from '../../utils/riskJobFormatting';
import { DashboardCard } from '../dashboard/DashboardCard';

export function RiskRainfallSection({ rainfall }: { rainfall: RiskJob['rainfall'] }) {
  const { theme } = useTheme();
  const windows = [['Últimas 24 horas', rainfall?.last24Hours], ['Últimos 7 dias', rainfall?.last7Days]] as const;
  return <>{windows.map(([label, window]) => window && <DashboardCard key={label} title={`Chuva · ${label}`}>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{formatRiskMetric(window.millimeters, 'mm')}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Cobertura: {window.complete === true ? 'Completa' : window.complete === false ? 'Parcial' : 'Sem dados'}</Text>
    {window.limitation && <Text style={[theme.typography.body, { color: theme.colors.text }]}>Limitação: {window.limitation}</Text>}
  </DashboardCard>)}</>;
}
