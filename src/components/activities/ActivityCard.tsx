import { Pressable, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Activity } from '../../types/activity';
import { formatActivityQuantity, formatActivityType } from '../../utils/activityFormatting';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';

export function ActivityCard({ activity, onPress }: { activity: Activity; onPress: () => void }) {
  const { theme } = useTheme();
  const title = formatActivityType(activity.type);
  const date = formatCropAreaDate(activity.performedAt);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${date}, quantidade ${formatActivityQuantity(activity.quantity, activity.unit)}`}
    accessibilityHint="Abre os detalhes da atividade" onPress={onPress}
    style={({ pressed }) => ({ minHeight: 48, padding: theme.spacing.xl, gap: theme.spacing.sm, borderRadius: theme.borders.large,
      borderWidth: theme.borders.width, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 })}>
    <Text style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{date}</Text>
    {activity.description && <Text numberOfLines={3} style={[theme.typography.body, { color: theme.colors.text }]}>{activity.description}</Text>}
    {activity.quantity !== null && <Text style={[theme.typography.label, { color: theme.colors.text }]}>{formatActivityQuantity(activity.quantity, activity.unit)}</Text>}
    <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Ver detalhes</Text>
  </Pressable>;
}
