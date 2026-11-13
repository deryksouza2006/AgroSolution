import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { formatAlertStatus, measurementOriginLabel, riskDemoLabel } from '../../utils/riskJobFormatting';
import { DashboardStatusBadge } from '../dashboard/DashboardBadges';

export function RiskBadge({ risk }: { risk: string | null }) {
  const { theme } = useTheme();
  if (risk !== null) return <DashboardStatusBadge kind="risk" value={risk} />;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
    <Ionicons name="help-circle-outline" color={theme.colors.textSecondary} size={24} accessible={false} />
    <Text style={[theme.typography.label, { color: theme.colors.textSecondary, flexShrink: 1 }]}>Risco: Sem dados</Text>
  </View>;
}
export function AlertStatusBadge({ status }: { status: string | null }) {
  const { theme } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
    <Ionicons name={status === 'RESOLVED' ? 'checkmark-done-outline' : status === 'ACKNOWLEDGED' ? 'eye-outline' : 'notifications-outline'} color={theme.colors.textSecondary} size={24} accessible={false} />
    <Text style={[theme.typography.label, { color: theme.colors.text, flexShrink: 1 }]}>Estado administrativo: {formatAlertStatus(status)}</Text>
  </View>;
}
export function RiskDemoNotice({ demo }: { demo: boolean }) {
  const { theme } = useTheme();
  const label = riskDemoLabel(demo);
  return label ? <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
    <Ionicons name="flask-outline" color={theme.colors.text} size={24} accessible={false} />
    <Text style={[theme.typography.label, { color: theme.colors.text, flexShrink: 1 }]}>{label}</Text>
  </View> : null;
}
export function MeasurementOriginBadge({ simulated }: { simulated: boolean | null }) {
  const { theme } = useTheme();
  return <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
    <Ionicons name={simulated === true ? 'flask-outline' : simulated === false ? 'radio-outline' : 'help-circle-outline'} color={theme.colors.text} size={22} accessible={false} />
    <Text style={[theme.typography.label, { color: theme.colors.text, flexShrink: 1 }]}>{measurementOriginLabel(simulated)}</Text>
  </View>;
}
