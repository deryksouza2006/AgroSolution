import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RiskResult } from '../../types/riskJob';
import { formatMoistureTrend, formatRiskMetric, formatRiskQuality, formatRiskRule } from '../../utils/riskJobFormatting';
import { DashboardCard } from '../dashboard/DashboardCard';
import { RiskBadge, RiskDemoNotice } from './RiskBadges';

export function RiskResultSection({ result }: { result: RiskResult | null }) {
  const { theme } = useTheme();
  const fields = [
    ['Disponibilidade hídrica', formatRiskMetric(result?.waterAvailabilityPercent, '%')],
    ['Disponibilidade bruta', formatRiskMetric(result?.rawAvailabilityPercent, '%')],
    ['VPD', formatRiskMetric(result?.vpdKpa, 'kPa')],
    ['Variação de umidade por hora', formatRiskMetric(result?.moistureChangePerHour, '/h')],
    ['Tendência de umidade', formatMoistureTrend(result?.moistureTrend ?? null)],
    ['Qualidade dos dados', formatRiskQuality(result?.dataQuality ?? null)],
    ['Versão das regras', result?.rulesVersion ?? 'Sem dados'],
  ];
  return <DashboardCard title="Resultado determinístico">
    <RiskBadge risk={result?.riskLevel ?? null} />
    <RiskDemoNotice demo={result?.demo === true} />
    {!result && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>O servidor ainda não disponibilizou o resultado desta análise.</Text>}
    {fields.map(([label, value]) => <View key={label} style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
    </View>)}
    {Boolean(result?.rulesTriggered.length) && <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>Regras acionadas</Text>
      {result?.rulesTriggered.map((rule, index) => <Text key={index} style={[theme.typography.body, { color: theme.colors.text }]}>• {formatRiskRule(rule)}</Text>)}
    </View>}
    {Boolean(result?.limitations.length) && <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>Limitações</Text>
      {result?.limitations.map((limitation, index) => <Text key={index} style={[theme.typography.body, { color: theme.colors.text }]}>• {limitation}</Text>)}
    </View>}
  </DashboardCard>;
}
