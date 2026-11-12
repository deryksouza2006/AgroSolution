import { Pressable, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Farm } from '../../types/farm';
import { formatFarmArea } from '../../utils/numberFormatting';

export function FarmCard({ farm, onPress }: { farm: Farm; onPress: () => void }) {
  const { theme } = useTheme();
  const area = formatFarmArea(farm.totalArea, farm.areaUnit);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${farm.name}, ${farm.city}, ${farm.state}, ${area}`}
      accessibilityHint="Abre os detalhes da propriedade" onPress={onPress}
      style={({ pressed }) => ({ minHeight: 48, padding: theme.spacing.xl, gap: theme.spacing.sm,
        backgroundColor: theme.colors.surface, borderRadius: theme.borders.large,
        borderWidth: theme.borders.width, borderColor: theme.colors.border, opacity: pressed ? 0.8 : 1 })}>
      <Text style={[theme.typography.title, { color: theme.colors.text }]}>{farm.name}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{farm.city}/{farm.state}</Text>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>{area}</Text>
      <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Ver detalhes</Text>
    </Pressable>
  );
}
