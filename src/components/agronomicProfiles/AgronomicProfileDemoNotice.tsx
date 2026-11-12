import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function AgronomicProfileDemoNotice() {
  const { theme } = useTheme();
  return <View style={{ padding: theme.spacing.lg, gap: theme.spacing.xs, borderRadius: theme.borders.radius,
    borderWidth: theme.borders.width, borderColor: theme.colors.warning, backgroundColor: theme.colors.surface }}>
    <Text accessibilityRole="header" style={[theme.typography.label, { color: theme.colors.warning }]}>Dados demonstrativos</Text>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>Este perfil foi identificado como demonstrativo.</Text>
  </View>;
}
