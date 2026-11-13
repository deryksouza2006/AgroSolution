import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Dashboard, DashboardPage } from '../../types/dashboard';
import { dashboardCounts } from '../../utils/dashboardFormatting';
import { AppButton } from '../AppButton';

export function DashboardSummaryCards({ dashboard, onAlerts }: { dashboard: Dashboard; onAlerts?: () => void }) {
  const { theme } = useTheme();
  const counts = dashboardCounts(dashboard);
  const fallbackHint = (page: DashboardPage<unknown>) => page.totalElements === null && page.available ? 'Itens recebidos; total não informado' : undefined;
  const cards: { label: string; value: number | null; icon: keyof typeof Ionicons.glyphMap; hint?: string }[] = [
    { label: 'Total de propriedades', value: counts.farms, icon: 'business-outline', hint: fallbackHint(dashboard.farms) },
    { label: 'Total de talhões', value: counts.cropAreas, icon: 'leaf-outline', hint: fallbackHint(dashboard.cropAreas) },
    { label: 'Leituras recentes', value: counts.recentReadings, icon: 'reader-outline', hint: fallbackHint(dashboard.recentReadings) },
    { label: 'Alertas abertos', value: counts.openAlerts, icon: 'notifications-outline', hint: fallbackHint(dashboard.alerts) },
    { label: 'Sensores com problemas', value: counts.sensorIssues, icon: 'hardware-chip-outline', hint: 'Nesta resposta, até 20 sensores' },
  ];
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
    {cards.map(card => <View key={card.label} style={{ flexGrow: 1, flexBasis: 180, gap: theme.spacing.sm,
      padding: theme.spacing.lg, borderRadius: theme.borders.large, backgroundColor: theme.colors.surface, borderWidth: theme.borders.width, borderColor: theme.colors.border }}>
      <Ionicons name={card.icon} size={28} color={theme.colors.primary} accessible={false} />
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>{card.label}</Text>
      <Text style={[theme.typography.hero, { color: theme.colors.text }]}>{card.value === null ? 'Não informado' : new Intl.NumberFormat('pt-BR').format(card.value)}</Text>
      {card.hint && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{card.hint}</Text>}
      {card.label === 'Alertas abertos' && onAlerts && <AppButton title="Ver alertas" variant="secondary" onPress={onAlerts} />}
    </View>)}
  </View>;
}
