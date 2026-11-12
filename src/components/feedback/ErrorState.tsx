import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppButton } from '../AppButton';

interface Props { message: string; title?: string; onRetry?: () => void }
export function ErrorState({ message, title = 'Não foi possível continuar', onRetry }: Props) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, padding: theme.spacing.lg, borderRadius: theme.borders.radius, borderWidth: theme.borders.width, borderColor: theme.colors.danger, backgroundColor: theme.colors.surface }}>
      <Text accessibilityRole="header" style={[theme.typography.label, { color: theme.colors.danger }]}>{title}</Text>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.text }]}>{message}</Text>
      {onRetry && <AppButton title="Tentar novamente" onPress={onRetry} variant="secondary" />}
    </View>
  );
}
