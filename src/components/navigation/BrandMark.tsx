import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export function BrandMark() {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, alignItems: 'flex-start' }}>
      <View style={{ padding: theme.spacing.lg, borderRadius: theme.borders.large, backgroundColor: theme.colors.primarySoft }}>
        <Ionicons name="leaf-outline" size={32} color={theme.colors.primary} accessible={false} />
      </View>
      <Text accessibilityRole="header" style={[theme.typography.hero, { color: theme.colors.text }]}>Monitoramento agrícola</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Tecnologia a serviço do campo.</Text>
    </View>
  );
}
