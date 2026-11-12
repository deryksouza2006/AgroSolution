import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { SensorStatus, SensorType } from '../../types/sensor';
import { SENSOR_STATUSES, SENSOR_TYPES } from '../../utils/sensorValidation';
import { formatSensorStatus, formatSensorType } from '../../utils/sensorFormatting';

type Props = { error?: string; disabled?: boolean } & (
  | { kind: 'type'; value: SensorType | ''; onChange: (value: SensorType) => void }
  | { kind: 'status'; value: SensorStatus; onChange: (value: SensorStatus) => void }
);
export function SensorOptionSelector(props: Props) {
  const { theme } = useTheme();
  const label = props.kind === 'type' ? 'Tipo de sensor' : 'Status administrativo';
  const options = props.kind === 'type'
    ? SENSOR_TYPES.map(value => ({ value, label: formatSensorType(value), select: () => props.onChange(value) }))
    : SENSOR_STATUSES.map(value => ({ value, label: formatSensorStatus(value), select: () => props.onChange(value) }));
  return <View style={{ gap: theme.spacing.sm }}>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>{label}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: theme.spacing.sm }}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.label}
        accessibilityState={{ checked: props.value === option.value, disabled: props.disabled }} disabled={props.disabled} onPress={option.select}
        style={{ minHeight: 48, padding: theme.spacing.md, borderRadius: theme.borders.radius, borderWidth: props.value === option.value ? 2 : 1,
          borderColor: props.error ? theme.colors.danger : props.value === option.value ? theme.colors.primary : theme.colors.border,
          backgroundColor: props.value === option.value ? theme.colors.primarySoft : theme.colors.surface, opacity: props.disabled ? 0.55 : 1 }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{option.label}{props.value === option.value ? ' · Selecionado' : ''}</Text>
      </Pressable>)}
    </View>
    {props.error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{props.error}</Text>}
  </View>;
}
