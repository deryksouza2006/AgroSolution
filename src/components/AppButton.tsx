import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityHint?: string;
}

export function AppButton({ title, onPress, loading = false, disabled = false, variant = 'primary', accessibilityHint }: AppButtonProps) {
  const { theme: { colors, typography, spacing, borders } } = useTheme();
  const blocked = disabled || loading;
  const backgroundColor = variant === 'primary' ? colors.primary : colors.surface;
  const color = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title} accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }} disabled={blocked} onPress={onPress}
      style={({ pressed }) => [styles.button, {
        backgroundColor, borderColor: variant === 'danger' ? colors.danger : colors.primary,
        borderWidth: borders.width, borderRadius: borders.radius,
        padding: spacing.md, gap: spacing.sm, opacity: blocked ? 0.55 : pressed ? 0.8 : 1,
      }]}
    >
      {loading && <ActivityIndicator color={color} />}
      <Text style={[typography.label, styles.text, { color }]}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 48, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  text: { flexShrink: 1, textAlign: 'center' },
});
