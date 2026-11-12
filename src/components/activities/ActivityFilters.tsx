import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { ActivityFilterErrors, ActivityFilters as Filters, ActivityFilterValues } from '../../types/activity';
import { toActivityFilters } from '../../utils/activityValidation';
import { AppButton } from '../AppButton';
import { AppInput } from '../AppInput';
import { ActivityTypeSelector } from './ActivityTypeSelector';

export function ActivityFilters({ initialValues, onApply }: { initialValues: ActivityFilterValues; onApply: (filters: Filters, values: ActivityFilterValues) => void }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ActivityFilterErrors>({});
  const apply = () => {
    const result = toActivityFilters(values);
    if (!result.valid) { setErrors(result.errors); return; }
    setErrors({});
    onApply(result.data, values);
    setOpen(false);
  };
  return <View style={{ gap: theme.spacing.lg }}>
    <AppButton title={open ? 'Ocultar filtros' : 'Filtrar atividades'} variant="secondary" onPress={() => setOpen(value => !value)} />
    {open && <View style={{ gap: theme.spacing.lg }}>
      <ActivityTypeSelector value={values.type} allowAll onChange={type => setValues(previous => ({ ...previous, type }))} error={errors.type} />
      <AppInput label="De (opcional)" value={values.fromDate} onChangeText={fromDate => setValues(previous => ({ ...previous, fromDate }))}
        error={errors.fromDate} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" maxLength={10} autoCorrect={false} />
      <AppInput label="Até (opcional)" value={values.toDate} onChangeText={toDate => setValues(previous => ({ ...previous, toDate }))}
        error={errors.toDate} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" maxLength={10} autoCorrect={false} />
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>O período inclui os dias completos no fuso do dispositivo. Você pode preencher somente um dos limites.</Text>
      <AppButton title="Aplicar filtros" onPress={apply} />
      <AppButton title="Limpar filtros" variant="secondary" onPress={() => {
        const empty: ActivityFilterValues = { type: '', fromDate: '', toDate: '' };
        setValues(empty); setErrors({}); onApply({}, empty); setOpen(false);
      }} />
    </View>}
  </View>;
}
