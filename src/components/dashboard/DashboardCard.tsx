import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../AppButton';

export function DashboardCard({ title, children, onPress, actionLabel = 'Ver talhão' }: PropsWithChildren<{ title: string; onPress?: () => void; actionLabel?: string }>) {
  const { theme } = useTheme();
  return <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface,
    borderRadius: theme.borders.large, borderWidth: theme.borders.width, borderColor: theme.colors.border }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
    {children}
    {onPress && <AppButton title={actionLabel} variant="secondary" onPress={onPress} accessibilityHint={`Abre ${actionLabel.toLowerCase()} referente a ${title}`} />}
  </View>;
}
