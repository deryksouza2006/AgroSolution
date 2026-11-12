import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { AgronomicProfile } from '../../types/agronomicProfile';
import { AgronomicProfileDemoNotice } from './AgronomicProfileDemoNotice';

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 21 });

export function AgronomicProfileSummary({ profile }: { profile: AgronomicProfile }) {
  const { theme } = useTheme();
  const depth = (value: number | null) => value == null ? 'Não informada' : `${numberFormatter.format(value)} cm`;
  const fields = [
    { label: 'Textura do solo', value: profile.soilTexture },
    { label: 'Capacidade de campo (%)', value: `${numberFormatter.format(profile.fieldCapacityPercent)}%` },
    { label: 'Ponto de murcha (%)', value: `${numberFormatter.format(profile.wiltingPointPercent)}%` },
    { label: 'Profundidade das raízes (cm)', value: depth(profile.rootDepthCentimeters) },
    { label: 'Profundidade do sensor (cm)', value: depth(profile.sensorDepthCentimeters) },
    { label: 'Fonte dos dados', value: profile.source },
  ];
  return <View style={{ gap: theme.spacing.lg }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Revisão {profile.revision}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Revisão mais recente disponibilizada pela API.</Text>
    {profile.demo && <AgronomicProfileDemoNotice />}
    <View style={{ gap: theme.spacing.lg, padding: theme.spacing.xl, borderRadius: theme.borders.large, backgroundColor: theme.colors.surface }}>
      {fields.map(field => <View key={field.label} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{field.label}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{field.value}</Text>
      </View>)}
    </View>
  </View>;
}
