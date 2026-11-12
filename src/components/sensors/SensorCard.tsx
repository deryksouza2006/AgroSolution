import { Pressable, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Sensor } from '../../types/sensor';
import { formatSensorStatus, formatSensorType } from '../../utils/sensorFormatting';

export function SensorCard({ sensor, onPress }: { sensor: Sensor; onPress: () => void }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityHint="Abre os detalhes e a saúde do sensor"
    accessibilityLabel={`${sensor.name}, ${sensor.deviceCode}, ${formatSensorType(sensor.sensorType)}, ${sensor.cropAreaName}, ${sensor.farmName}, status administrativo ${formatSensorStatus(sensor.status)}`}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 48, padding: theme.spacing.xl, gap: theme.spacing.sm,
      borderRadius: theme.borders.large, borderWidth: theme.borders.width, borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 })}>
    <Text style={[theme.typography.title, { color: theme.colors.text }]}>{sensor.name}</Text>
    <Text selectable style={[theme.typography.label, { color: theme.colors.text }]}>{sensor.deviceCode}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{formatSensorType(sensor.sensorType)}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Talhão: {sensor.cropAreaName}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Propriedade: {sensor.farmName}</Text>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Status administrativo: {formatSensorStatus(sensor.status)}</Text>
    <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Ver detalhes e saúde</Text>
  </Pressable>;
}
