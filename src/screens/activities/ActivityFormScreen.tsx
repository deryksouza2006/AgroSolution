import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Text } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ActivityAccessNotice } from '../../components/activities/ActivityAccessNotice';
import { ActivityTypeSelector } from '../../components/activities/ActivityTypeSelector';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useActivity } from '../../hooks/activities/useActivity';
import { useActivityAccess } from '../../hooks/activities/useActivityAccess';
import { useCreateActivity } from '../../hooks/activities/useCreateActivity';
import { useUpdateActivity } from '../../hooks/activities/useUpdateActivity';
import { useTheme } from '../../hooks/useTheme';
import type { Activity, ActivityFormErrors, ActivityFormValues } from '../../types/activity';
import type { ActivitiesStackParamList } from '../../types/navigation';
import { isActivityNotFound, parseActivityError } from '../../utils/activityErrors';
import { toActivityRequest, toLocalDateTimeFields } from '../../utils/activityValidation';
import { parseApiFieldErrors } from '../../utils/errors';
import { parseCropAreaError } from '../../utils/cropAreaErrors';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityCreate'>
  | NativeStackScreenProps<ActivitiesStackParamList, 'ActivityEdit'>;

function ActivityForm({ navigation, cropAreaId, initialActivity, access, loadError, onRetryLoad }: {
  navigation: Props['navigation']; cropAreaId: number; initialActivity?: Activity;
  access: ReturnType<typeof useActivityAccess>; loadError?: string; onRetryLoad?: () => void;
}) {
  const { theme } = useTheme();
  const create = useCreateActivity(cropAreaId);
  const update = useUpdateActivity(cropAreaId);
  const [initialValues] = useState<ActivityFormValues>(() => ({
    type: initialActivity?.type ?? '',
    ...toLocalDateTimeFields(initialActivity?.performedAt ?? new Date().toISOString()),
    description: initialActivity?.description ?? '',
    quantity: initialActivity?.quantity === null || initialActivity?.quantity === undefined ? '' : String(initialActivity.quantity).replace('.', ','),
    unit: initialActivity?.unit ?? '',
  }));
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ActivityFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Activity | null>(null);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const confirming = useRef(false);
  const pending = create.isPending || update.isPending;
  const dirty = (Object.keys(initialValues) as (keyof ActivityFormValues)[]).some(key => values[key] !== initialValues[key]);
  const blocked = !access.canWrite || pending || saved !== null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  usePreventRemove(!saved && (dirty || pending), ({ data }) => {
    if (pending || submitting.current) { Alert.alert('Salvando atividade', 'Aguarde a conclusão do envio antes de sair.'); return; }
    if (confirming.current) return;
    confirming.current = true;
    Alert.alert('Descartar alterações?', 'Você possui alterações não salvas nesta atividade.', [
      { text: 'Continuar editando', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => {
        confirming.current = false;
        if (mounted.current) navigation.dispatch(data.action);
      } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  });

  useEffect(() => {
    if (!saved) return;
    if (initialActivity) navigation.popTo('ActivityDetails', { cropAreaId, id: saved.id });
    else navigation.replace('ActivityDetails', { cropAreaId, id: saved.id });
  }, [saved, initialActivity, navigation, cropAreaId]);

  const change = <Key extends keyof ActivityFormValues>(key: Key, value: ActivityFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };
  const submit = async () => {
    if (submitting.current || blocked) return;
    const result = toActivityRequest(values);
    setSubmitError(null);
    if (!result.valid) { setErrors(result.errors); return; }
    setErrors({});
    submitting.current = true;
    Keyboard.dismiss();
    if (initialActivity && values.date === initialValues.date && values.time === initialValues.time) result.data.performedAt = initialActivity.performedAt;
    try {
      const activity = initialActivity
        ? await update.mutateAsync({ id: initialActivity.id, input: result.data })
        : await create.mutateAsync(result.data);
      if (mounted.current) setSaved(activity);
    } catch (error: unknown) {
      if (!mounted.current) return;
      setSubmitError(parseActivityError(error));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: ActivityFormErrors = {};
      for (const key of Object.keys(initialValues) as (keyof ActivityFormValues)[]) if (fields[key]) fieldErrors[key] = fields[key];
      if (fields.performedAt) { fieldErrors.date = fields.performedAt; fieldErrors.time = fields.performedAt; }
      setErrors(fieldErrors);
    } finally { submitting.current = false; }
  };

  return <ScreenContainer keyboard>
    <ActivityAccessNotice access={access} />
    {loadError && <ErrorState title="Não foi possível atualizar a atividade" message={loadError} onRetry={onRetryLoad} />}
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Tipo, data e horário são obrigatórios. Preencha as datas no fuso do dispositivo. A atividade deve ter sido realizada até o momento atual.</Text>
    <ActivityTypeSelector value={values.type} onChange={value => change('type', value)} error={errors.type} disabled={blocked} />
    <AppInput label="Data da atividade" value={values.date} onChangeText={value => change('date', value)} error={errors.date}
      editable={!blocked} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} hint="Formato DD/MM/AAAA." />
    <AppInput label="Horário da atividade" value={values.time} onChangeText={value => change('time', value)} error={errors.time}
      editable={!blocked} placeholder="HH:mm" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={12} hint="Horário local, no formato HH:mm ou HH:mm:ss. Frações de segundo são opcionais." />
    <AppInput label="Descrição (opcional)" value={values.description} onChangeText={value => change('description', value)} error={errors.description}
      editable={!blocked} multiline textAlignVertical="top" style={{ minHeight: 120 }} hint={`${values.description.length}/2000 caracteres`} />
    <AppInput label="Quantidade (opcional)" value={values.quantity} onChangeText={value => change('quantity', value)} error={errors.quantity}
      editable={!blocked} keyboardType="decimal-pad" maxLength={32} hint="Positiva, com vírgula ou ponto e até 3 casas decimais. Preencha também a unidade." />
    <AppInput label="Unidade (opcional)" value={values.unit} onChangeText={value => change('unit', value)} error={errors.unit}
      editable={!blocked} autoCorrect={false} autoCapitalize="none" hint="Até 30 caracteres. Ex.: L, kg ou unidades. Preencha junto com a quantidade." />
    {submitError && <ErrorState title="Não foi possível salvar a atividade" message={submitError} />}
    <AppButton title={pending ? 'Salvando…' : initialActivity ? 'Salvar alterações' : 'Cadastrar atividade'} loading={pending} disabled={blocked} onPress={() => { void submit(); }} />
    <AppButton title="Cancelar" variant="secondary" disabled={pending || saved !== null} onPress={() => navigation.goBack()} />
  </ScreenContainer>;
}

export function ActivityFormScreen({ route, navigation }: Props) {
  const { cropAreaId } = route.params;
  const id = route.name === 'ActivityEdit' ? route.params.id : undefined;
  const query = useActivity(cropAreaId, id);
  const access = useActivityAccess(cropAreaId);
  if (access.query.isPending || (id !== undefined && query.isPending)) return <ScreenContainer><LoadingState message="Carregando dados da atividade…" /></ScreenContainer>;
  if (!access.query.data) return <ScreenContainer><ErrorState message={parseCropAreaError(access.query.error)} onRetry={() => { void access.query.refetch(); }} /></ScreenContainer>;
  if (id !== undefined && (!query.data || isActivityNotFound(query.error))) return <ScreenContainer><ErrorState message={parseActivityError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  return <ActivityForm key={`${cropAreaId}-${id ?? 'new'}`} navigation={navigation} cropAreaId={cropAreaId} initialActivity={query.data}
    access={access} loadError={query.isError ? parseActivityError(query.error) : undefined} onRetryLoad={() => { void query.refetch(); }} />;
}
