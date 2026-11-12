import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={message} accessibilityState={{ busy: true }} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing.lg, paddingVertical: theme.spacing.xxl }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
    </View>
  );
}
