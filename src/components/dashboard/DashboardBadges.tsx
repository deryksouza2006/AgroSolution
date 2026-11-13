import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardProvenance } from '../../types/dashboard';
import { dashboardDataLabels, formatDashboardJobStatus, formatDashboardRisk } from '../../utils/dashboardFormatting';

export function DashboardStatusBadge({ value, kind }: { value: string | null; kind: 'risk' | 'job' }) {
  const { theme } = useTheme();
  let color = theme.colors.textSecondary;
  let icon: keyof typeof Ionicons.glyphMap = 'help-circle-outline';
  if (kind === 'risk') {
    if (value === 'NORMAL') { color = theme.colors.success; icon = 'checkmark-circle-outline'; }
    if (value === 'ATTENTION') { color = theme.colors.warning; icon = 'alert-circle-outline'; }
    if (value === 'CRITICAL') { color = theme.colors.danger; icon = 'warning-outline'; }
  } else {
    if (value === 'FAILED') { color = theme.colors.danger; icon = 'close-circle-outline'; }
    if (value === 'PROCESSING') { color = theme.colors.primary; icon = 'sync-outline'; }
    if (value === 'PENDING' || value === 'QUEUED') { color = theme.colors.warning; icon = 'time-outline'; }
    if (value === 'COMPLETED' || value === 'COMPLETED_WITHOUT_AI') { color = theme.colors.success; icon = 'checkmark-circle-outline'; }
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
    <Ionicons name={icon} color={color} size={24} accessible={false} />
    <Text style={[theme.typography.label, { color, flexShrink: 1 }]}>{kind === 'risk' ? `Risco: ${formatDashboardRisk(value)}` : `Processamento: ${formatDashboardJobStatus(value)}`}</Text>
  </View>;
}
export function DashboardDataNotice({ data }: { data: DashboardProvenance }) {
  const { theme } = useTheme();
  return <>{dashboardDataLabels(data).map(label => <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
    <Ionicons name="flask-outline" color={theme.colors.text} size={22} accessible={false} />
    <Text style={[theme.typography.label, { color: theme.colors.text, flexShrink: 1 }]}>{label}</Text>
  </View>)}</>;
}
