import { useId, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
}
export function AppInput({ label, error, hint, trailing, style, ...props }: AppInputProps) {
  const id = useId();
  const { theme: { colors, typography, spacing, borders } } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text nativeID={id} style={[typography.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.row, { borderWidth: borders.width, borderRadius: borders.radius, borderColor: error ? colors.danger : colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          {...props} accessibilityLabel={label} accessibilityLabelledBy={id}
          accessibilityHint={error ?? hint} placeholderTextColor={colors.textSecondary}
          style={[styles.input, typography.body, { color: colors.text, padding: spacing.md }, style]}
        />
        {trailing}
      </View>
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[typography.caption, { color: colors.danger }]}>{error}</Text>
        : hint ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, minHeight: 48, minWidth: 0 },
});
