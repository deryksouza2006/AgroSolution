import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { CropAreaStatus } from '../../types/cropArea';
import { formatCropAreaStatus } from '../../utils/cropAreaFormatting';

export function CropAreaStatusBadge({ status }: { status: CropAreaStatus }) {
  const { theme } = useTheme();
  const colors: Record<CropAreaStatus, string> = {
    NORMAL: theme.colors.success, ATTENTION: theme.colors.warning,
    CRITICAL: theme.colors.danger, ARCHIVED: theme.colors.textSecondary,
  };
  const color = Object.hasOwn(colors, status) ? colors[status] : theme.colors.textSecondary;
  return <View style={{ alignSelf: 'flex-start', paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borders.radius, borderWidth: theme.borders.width, borderColor: color,
    backgroundColor: theme.colors.surface }}>
    <Text style={[theme.typography.label, { color }]}>Status: {formatCropAreaStatus(status)}</Text>
  </View>;
}
