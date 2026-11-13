import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { MeasurementField, Reading } from '../../types/reading';
import { formatReadingValue, readingMeasurementLabels } from '../../utils/readingFormatting';
import { READING_MEASUREMENTS } from '../../utils/readingValidation';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';

export function ReadingMeasurements({ reading }: { reading: Pick<Reading, MeasurementField | 'rainfallIntervalStart'> }) {
  const { theme } = useTheme();
  return <View style={{ gap: theme.spacing.sm }}>
    {READING_MEASUREMENTS.map(field => reading[field] !== null && reading[field] !== undefined && <Text key={field} style={[theme.typography.body, { color: theme.colors.text }]}>
      {readingMeasurementLabels[field]}: {formatReadingValue(reading[field], field)}
    </Text>)}
    {reading.rainfallIntervalStart && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Início do intervalo de chuva: {formatCropAreaDate(reading.rainfallIntervalStart)}</Text>}
  </View>;
}
