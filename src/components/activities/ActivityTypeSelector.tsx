import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ActivityType } from '../../types/activity';
import { ACTIVITY_TYPES } from '../../utils/activityValidation';
import { formatActivityType } from '../../utils/activityFormatting';

interface Props { value: ActivityType | ''; onChange: (value: ActivityType | '') => void; allowAll?: boolean; error?: string; disabled?: boolean }
export function ActivityTypeSelector({ value, onChange, allowAll = false, error, disabled = false }: Props) {
  const { theme } = useTheme();
  const options: readonly (ActivityType | '')[] = allowAll ? ['', ...ACTIVITY_TYPES] : ACTIVITY_TYPES;
  return <View style={{ gap: theme.spacing.sm }}>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Tipo de atividade</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Tipo de atividade" style={{ gap: theme.spacing.sm }}>
      {options.map(type => <Pressable key={type || 'all'} accessibilityRole="radio" accessibilityLabel={type ? formatActivityType(type) : 'Todos os tipos'}
        accessibilityState={{ checked: value === type, disabled }} disabled={disabled} onPress={() => onChange(type)}
        style={{ minHeight: 48, padding: theme.spacing.md, borderRadius: theme.borders.radius, borderWidth: value === type ? 2 : 1,
          borderColor: error ? theme.colors.danger : value === type ? theme.colors.primary : theme.colors.border,
          backgroundColor: value === type ? theme.colors.primarySoft : theme.colors.surface, opacity: disabled ? 0.55 : 1 }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{type ? formatActivityType(type) : 'Todos os tipos'}{value === type ? ' · Selecionado' : ''}</Text>
      </Pressable>)}
    </View>
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>}
  </View>;
}
