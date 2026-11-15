import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useCreateFarm } from '../../hooks/farms/useCreateFarm';
import { useFarm } from '../../hooks/farms/useFarm';
import { useUpdateFarm } from '../../hooks/farms/useUpdateFarm';
import { useTheme } from '../../hooks/useTheme';
import type { AreaUnit, Farm, FarmFormErrors, FarmFormValues } from '../../types/farm';
import type { FarmsStackParamList } from '../../types/navigation';
import { parseApiFieldErrors } from '../../utils/errors';
import { isFarmNotFound, parseFarmError } from '../../utils/farmErrors';
import { toFarmRequest } from '../../utils/farmValidation';
import { formatAreaUnit } from '../../utils/numberFormatting';

type Props = NativeStackScreenProps<FarmsStackParamList, 'FarmCreate'>
  | NativeStackScreenProps<FarmsStackParamList, 'FarmEdit'>;
const units: AreaUnit[] = ['HECTARE', 'SQUARE_METER'];
const emptyValues: FarmFormValues = { name: '', city: '', state: '', totalArea: '', areaUnit: '' };

function FarmForm({ navigation, initialFarm, loadError, onRetryLoad }: {
  navigation: Props['navigation']; initialFarm?: Farm; loadError?: string; onRetryLoad?: () => void;
}) {
  const { theme } = useTheme();
  const create = useCreateFarm();
  const update = useUpdateFarm();
  const [initialValues] = useState<FarmFormValues>(() => initialFarm ? {
    name: initialFarm.name, city: initialFarm.city, state: initialFarm.state,
    totalArea: String(initialFarm.totalArea).replace('.', ','), areaUnit: initialFarm.areaUnit,
  } : { ...emptyValues });
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FarmFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedFarm, setSavedFarm] = useState<Farm | null>(null);
  const active = useRef(false);
  const submitting = useRef(false);
  const confirming = useRef(false);
  const pending = create.isPending || update.isPending;
  const dirty = (Object.keys(initialValues) as (keyof FarmFormValues)[]).some(key => values[key] !== initialValues[key]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  usePreventRemove(!savedFarm && (dirty || pending), ({ data }) => {
    if (submitting.current || pending) {
      Alert.alert('Salvando propriedade', 'Aguarde a conclusão do envio antes de sair.');
      return;
    }
    if (confirming.current) return;
    confirming.current = true;
    Alert.alert('Descartar alterações?', 'Você possui alterações não salvas nesta propriedade.', [
      { text: 'Continuar editando', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => {
        confirming.current = false;
        if (active.current) navigation.dispatch(data.action);
      } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  });

  useEffect(() => {
    if (!savedFarm) return;
    if (initialFarm) navigation.popTo('FarmDetails', { id: savedFarm.id });
    else navigation.replace('FarmDetails', { id: savedFarm.id });
  }, [savedFarm, initialFarm, navigation]);

  const change = <Key extends keyof FarmFormValues>(key: Key, value: FarmFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };

  const submit = async () => {
    if (submitting.current || pending || savedFarm) return;
    const result = toFarmRequest(values);
    setSubmitError(null);
    if (!result.valid) { setErrors(result.errors); return; }
    setErrors({});
    submitting.current = true;
    Keyboard.dismiss();
    try {
      const farm = initialFarm
        ? await update.mutateAsync({ id: initialFarm.id, input: result.data })
        : await create.mutateAsync(result.data);
      if (active.current) setSavedFarm(farm);
    } catch (error: unknown) {
      if (!active.current) return;
      setSubmitError(parseFarmError(error));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: FarmFormErrors = {};
      for (const key of Object.keys(emptyValues) as (keyof FarmFormValues)[]) {
        if (fields[key]) fieldErrors[key] = fields[key];
      }
      setErrors(fieldErrors);
    } finally { submitting.current = false; }
  };

  const blocked = pending || savedFarm !== null;
  return (
    <ScreenContainer keyboard>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Todos os campos são obrigatórios.</Text>
      {loadError && <ErrorState title="Não foi possível atualizar os dados" message={loadError} onRetry={onRetryLoad} />}
      <AppInput label="Nome da propriedade" value={values.name} onChangeText={value => change('name', value)} error={errors.name} editable={!blocked} autoCapitalize="words" />
      <AppInput label="Cidade" value={values.city} onChangeText={value => change('city', value)} error={errors.city} editable={!blocked} autoCapitalize="words" />
      <AppInput label="UF" value={values.state} onChangeText={value => change('state', value.toUpperCase())} error={errors.state} hint="Sigla brasileira, como SP ou MG." editable={!blocked} autoCapitalize="characters" autoCorrect={false} maxLength={2} />
      <AppInput label="Área total" value={values.totalArea} onChangeText={value => change('totalArea', value)} error={errors.totalArea} hint="Ex.: 25,50 ou 25.50. Use até 2 casas decimais, sem separador de milhar." keyboardType="decimal-pad" editable={!blocked} maxLength={32} />
      <View style={{ gap: theme.spacing.sm }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>Unidade da área</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Unidade da área" style={{ gap: theme.spacing.sm }}>
          {units.map(unit => <Pressable key={unit} accessibilityRole="radio" accessibilityLabel={formatAreaUnit(unit)}
            accessibilityState={{ checked: values.areaUnit === unit, disabled: blocked }} disabled={blocked}
            onPress={() => change('areaUnit', unit)} style={{ minHeight: 48, padding: theme.spacing.md,
              backgroundColor: values.areaUnit === unit ? theme.colors.primarySoft : theme.colors.surface,
              borderRadius: theme.borders.radius, borderWidth: values.areaUnit === unit ? 2 : 1,
              borderColor: errors.areaUnit ? theme.colors.danger : values.areaUnit === unit ? theme.colors.primary : theme.colors.border,
              opacity: blocked ? 0.55 : 1 }}>
            <Text style={[theme.typography.label, { color: theme.colors.text }]}>{formatAreaUnit(unit)}{values.areaUnit === unit ? ' · Selecionado' : ''}</Text>
          </Pressable>)}
        </View>
        {errors.areaUnit && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{errors.areaUnit}</Text>}
      </View>
      {submitError && <ErrorState title="Não foi possível salvar a propriedade" message={submitError} />}
      <AppButton title={pending ? 'Salvando…' : initialFarm ? 'Salvar alterações' : 'Cadastrar propriedade'} loading={pending} disabled={blocked} onPress={() => { void submit(); }} />
      <AppButton title="Cancelar" variant="secondary" disabled={blocked} onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

export function FarmFormScreen({ navigation, route }: Props) {
  const id = route.name === 'FarmEdit' ? route.params?.id : undefined;
  const query = useFarm(id);
  if (route.name === 'FarmCreate') return <FarmForm navigation={navigation} />;
  if (query.isPending) return <ScreenContainer><LoadingState message="Carregando propriedade…" /></ScreenContainer>;
  if (!query.data || isFarmNotFound(query.error)) return <ScreenContainer><ErrorState message={parseFarmError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  return <FarmForm navigation={navigation} initialFarm={query.data}
    loadError={query.isError ? parseFarmError(query.error) : undefined}
    onRetryLoad={() => { void query.refetch(); }} />;
}
