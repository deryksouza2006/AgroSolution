import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { AreaUnit } from '../types/farm';
import { formatAreaUnit } from '../utils/numberFormatting';

interface Props { value: AreaUnit | ''; onChange: (unit: AreaUnit) => void; error?: string; disabled?: boolean }
const units: AreaUnit[] = ['HECTARE', 'SQUARE_METER'];

export function AreaUnitSelector({ value, onChange, error, disabled = false }: Props) {
  const { theme } = useTheme();
  return <View style={{ gap: theme.spacing.sm }}>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Unidade da área</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Unidade da área" style={{ gap: theme.spacing.sm }}>
      {units.map(unit => <Pressable key={unit} accessibilityRole="radio" accessibilityLabel={formatAreaUnit(unit)}
        accessibilityState={{ checked: value === unit, disabled }} disabled={disabled} onPress={() => onChange(unit)}
        style={{ minHeight: 48, padding: theme.spacing.md, borderRadius: theme.borders.radius,
          backgroundColor: value === unit ? theme.colors.primarySoft : theme.colors.surface,
          borderWidth: value === unit ? 2 : 1, borderColor: error ? theme.colors.danger : value === unit ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? 0.55 : 1 }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{formatAreaUnit(unit)}{value === unit ? ' · Selecionado' : ''}</Text>
      </Pressable>)}
    </View>
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>}
  </View>;
}
