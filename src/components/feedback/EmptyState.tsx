import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface Props { title: string; message: string; icon?: keyof typeof Ionicons.glyphMap }
export function EmptyState({ title, message, icon = 'leaf-outline' }: Props) {
  const { theme } = useTheme();
  return (
    <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large, borderWidth: theme.borders.width, borderColor: theme.colors.border }}>
      <Ionicons accessible={false} name={icon} size={40} color={theme.colors.primary} />
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}
