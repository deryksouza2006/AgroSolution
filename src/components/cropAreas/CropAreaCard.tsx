import { Pressable, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { CropArea } from '../../types/cropArea';
import { formatFarmArea } from '../../utils/numberFormatting';
import { formatCropAreaStatus } from '../../utils/cropAreaFormatting';
import { CropAreaStatusBadge } from './CropAreaStatusBadge';

export function CropAreaCard({ area, onPress }: { area: CropArea; onPress: () => void }) {
  const { theme } = useTheme();
  const size = formatFarmArea(area.areaSize, area.areaUnit);
  return <Pressable accessibilityRole="button" accessibilityHint="Abre os detalhes do talhão"
    accessibilityLabel={`${area.name}, cultivo ${area.cropType}, propriedade ${area.farmName}, ${size}, status ${formatCropAreaStatus(area.status)}`}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 48, padding: theme.spacing.xl, gap: theme.spacing.sm,
      borderRadius: theme.borders.large, borderWidth: theme.borders.width, borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 })}>
    <Text style={[theme.typography.title, { color: theme.colors.text }]}>{area.name}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>Cultivo: {area.cropType}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Propriedade: {area.farmName}</Text>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>{size}</Text>
    <CropAreaStatusBadge status={area.status} />
    <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Ver detalhes</Text>
  </Pressable>;
}
