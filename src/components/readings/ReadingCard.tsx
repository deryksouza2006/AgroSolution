import { Pressable, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Reading } from '../../types/reading';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';
import { formatReadingSource, formatReadingValue, isSimulatedReading, readingMeasurementLabels } from '../../utils/readingFormatting';
import { READING_MEASUREMENTS } from '../../utils/readingValidation';
import { ReadingMeasurements } from './ReadingMeasurements';

export function ReadingCard({ reading, onPress }: { reading: Reading; onPress: () => void }) {
  const { theme } = useTheme();
  const measurements = READING_MEASUREMENTS.filter(field => reading[field] !== null && reading[field] !== undefined)
    .map(field => `${readingMeasurementLabels[field]}: ${formatReadingValue(reading[field], field)}`).join(', ');
  return <Pressable accessibilityRole="button" accessibilityHint="Abre os detalhes da leitura"
    accessibilityLabel={`${reading.sensorName}, ${formatCropAreaDate(reading.measuredAt)}, ${reading.cropAreaName}, ${reading.farmName}, ${measurements}, origem ${formatReadingSource(reading.source)}${isSimulatedReading(reading) ? ', dados simulados' : ''}`}
    onPress={onPress} style={({ pressed }) => ({ minHeight: 48, padding: theme.spacing.xl, gap: theme.spacing.sm,
      borderRadius: theme.borders.large, borderWidth: theme.borders.width, borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 })}>
    <Text style={[theme.typography.title, { color: theme.colors.text }]}>{reading.sensorName}</Text>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Medição: {formatCropAreaDate(reading.measuredAt)}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{reading.cropAreaName} · {reading.farmName}</Text>
    <ReadingMeasurements reading={reading} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Origem: {formatReadingSource(reading.source)}</Text>
    {isSimulatedReading(reading) && <Text style={[theme.typography.label, { color: theme.colors.text }]}>Dados simulados</Text>}
    <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Ver detalhes</Text>
  </Pressable>;
}
