import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { SensorHealth } from '../../types/sensor';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';
import { interpretSensorHealth } from '../../utils/sensorFormatting';

export function SensorHealthPanel({ health }: { health: SensorHealth }) {
  const { theme } = useTheme();
  const data = interpretSensorHealth(health);
  const fields = [
    ['Status administrativo informado na consulta', data.administrativeStatus],
    ['Comunicação', data.communication], ['Saúde calculada', data.calculatedHealth],
    ['Última leitura', data.lastMeasuredAt ? formatCropAreaDate(data.lastMeasuredAt) : 'Sem leituras registradas'],
    ['Idade da última leitura', data.ageSeconds === null ? 'Não informada' : `${new Intl.NumberFormat('pt-BR').format(data.ageSeconds)} segundos`],
    ['Bateria', data.battery], ['Calibração', data.calibratedAt ? formatCropAreaDate(data.calibratedAt) : 'Não informada'],
    ['Nota de manutenção', data.maintenanceNote], ['Política demonstrativa aplicada', data.policy],
  ];
  return <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Saúde do sensor</Text>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Política de saúde demonstrativa</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Os estados abaixo são calculados pelo servidor com uma política demonstrativa. Eles não representam um diagnóstico real de hardware.</Text>
    {fields.map(([label, value]) => <View key={label} style={{ gap: theme.spacing.xs }}>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
    </View>)}
  </View>;
}
