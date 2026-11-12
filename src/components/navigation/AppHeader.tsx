import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

export function AppHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: theme.colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderBottomWidth: theme.borders.width, borderBottomColor: theme.colors.border }}>
        {onBack && <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onBack} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back-outline" size={24} color={theme.colors.primary} accessible={false} />
        </Pressable>}
        <Text accessibilityRole="header" style={[theme.typography.title, { flex: 1, color: theme.colors.text }]}>{title}</Text>
      </View>
    </SafeAreaView>
  );
}
