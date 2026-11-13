import { Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardActivity } from '../../types/dashboard';
import { formatActivityType } from '../../utils/activityFormatting';
import { isActivityType } from '../../utils/activityValidation';
import { formatDashboardDate } from '../../utils/dashboardFormatting';
import { DashboardCard } from './DashboardCard';
import { DashboardDataNotice } from './DashboardBadges';

export function DashboardActivityCard({ activity, cropName, onPress }: { activity: DashboardActivity; cropName: string; onPress?: () => void }) {
  const { theme } = useTheme();
  const title = activity.type && isActivityType(activity.type) ? formatActivityType(activity.type) : 'Atividade com tipo não informado';
  return <DashboardCard title={title} onPress={onPress} actionLabel="Abrir diário agrícola">
    <DashboardDataNotice data={activity} />
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{cropName}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{formatDashboardDate(activity.performedAt)}</Text>
    {activity.description && <Text style={[theme.typography.body, { color: theme.colors.text }]}>{activity.description}</Text>}
  </DashboardCard>;
}
