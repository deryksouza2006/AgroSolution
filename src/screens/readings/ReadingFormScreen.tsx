import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SensorSelector } from '../../components/sensors/SensorSelector';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useCropArea } from '../../hooks/cropAreas/useCropArea';
import { useCreateReading } from '../../hooks/readings/useCreateReading';
import { useSensor } from '../../hooks/sensors/useSensor';
import { useTheme } from '../../hooks/useTheme';
import type { Sensor } from '../../types/sensor';
import type { Reading, ReadingFormErrors, ReadingFormValues } from '../../types/reading';
import type { ReadingsStackParamList } from '../../types/navigation';
import { isCropAreaNotFound, parseCropAreaError } from '../../utils/cropAreaErrors';
import { parseApiFieldErrors } from '../../utils/errors';
import { parseReadingError, readingConflict } from '../../utils/readingErrors';
import { readingMeasurementLabels, readingMeasurementUnits } from '../../utils/readingFormatting';
import { isSensorNotFound, parseSensorError } from '../../utils/sensorErrors';
import { readingFieldsForType, READING_MEASUREMENTS, toReadingRequest } from '../../utils/readingValidation';

type Props = NativeStackScreenProps<ReadingsStackParamList, 'ReadingCreate'>;
const emptyValues: ReadingFormValues = { sensorId: null, temperatureCelsius: '', airHumidityPercent: '', soilMoisturePercent: '',
  batteryPercent: '', rainfallMillimeters: '', measuredDate: '', measuredTime: '', rainfallStartDate: '', rainfallStartTime: '' };

export function ReadingFormScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { scope } = route.params;
  const create = useCreateReading();
  const [initialValues] = useState<ReadingFormValues>(() => ({ ...emptyValues, sensorId: route.params.sensorId ?? null }));
  const [values, setValues] = useState(initialValues);
  const [selection, setSelection] = useState<Sensor | null>(null);
  const sensorQuery = useSensor(values.sensorId ?? undefined);
  const sensor = sensorQuery.data ?? (selection?.id === values.sensorId ? selection : null);
  const areaQuery = useCropArea(sensor?.cropAreaId);
  const [errors, setErrors] = useState<ReadingFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Reading | null>(null);
  const [checking, setChecking] = useState(false);
  const mounted = useRef(false), submitting = useRef(false), confirming = useRef(false);
  const pending = create.isPending;
  const blocked = pending || saved !== null;
  const canRegister = Boolean(sensorQuery.data && !sensorQuery.isError && !sensorQuery.isFetching && sensorQuery.data.status === 'ACTIVE'
    && areaQuery.data && !areaQuery.isError && !areaQuery.isFetching && areaQuery.data.status !== 'ARCHIVED');
  const dirty = (Object.keys(initialValues) as (keyof ReadingFormValues)[]).some(key => values[key] !== initialValues[key]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  usePreventRemove(!saved && (dirty || pending || checking), ({ data }) => {
    if (pending || submitting.current || checking) { Alert.alert('Registrando leitura', 'Aguarde a conclusão do envio antes de sair.'); return; }
    if (confirming.current) return;
    confirming.current = true;
    Alert.alert('Descartar leitura?', 'Você possui alterações não salvas nesta leitura.', [
      { text: 'Continuar preenchendo', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => { confirming.current = false; if (mounted.current) navigation.dispatch(data.action); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  });
  useEffect(() => { if (saved) navigation.replace('ReadingDetails', { id: saved.id, scope }); }, [saved, navigation, scope]);
  const change = <Key extends keyof ReadingFormValues>(key: Key, value: ReadingFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined, measurements: undefined }));
  };
  const refreshAccess = async () => {
    if (!values.sensorId || checking || blocked) return;
    setChecking(true);
    try {
      // A refreshed sensor may point to another crop area; its query will load that destination.
      await Promise.allSettled([sensorQuery.refetch(), ...(sensor ? [areaQuery.refetch()] : [])]);
    } finally { if (mounted.current) setChecking(false); }
  };
  const submit = async () => {
    if (submitting.current || blocked || checking) return;
    const request = toReadingRequest(values, sensor?.sensorType);
    setSubmitError(null);
    if (!request.valid) { setErrors(request.errors); return; }
    if (!canRegister) { setSubmitError('Atualize e selecione um sensor ativo de um talhão não arquivado antes de registrar.'); return; }
    setErrors({});
    submitting.current = true;
    Keyboard.dismiss();
    try {
      const reading = await create.mutateAsync(request.data);
      if (mounted.current) setSaved(reading);
    } catch (error: unknown) {
      if (!mounted.current) return;
      setSubmitError(parseReadingError(error));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: ReadingFormErrors = {};
      for (const key of Object.keys(emptyValues) as (keyof ReadingFormValues)[]) if (fields[key]) fieldErrors[key] = fields[key];
      if (fields.measuredAt) { fieldErrors.measuredDate = fields.measuredAt; fieldErrors.measuredTime = fields.measuredAt; }
      if (fields.rainfallIntervalStart) { fieldErrors.rainfallStartDate = fields.rainfallIntervalStart; fieldErrors.rainfallStartTime = fields.rainfallIntervalStart; }
      setErrors(fieldErrors);
      if (readingConflict(error) === 'inactive' || readingConflict(error) === 'archived') {
        setChecking(true);
        await Promise.allSettled([sensorQuery.refetch(), areaQuery.refetch()]);
        if (mounted.current) setChecking(false);
      }
    } finally { submitting.current = false; }
  };
  const weather = sensor?.sensorType === 'WEATHER_STATION';
  return <ScreenContainer keyboard>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Registro manual. Selecione um sensor ativo e informe sua medição. A leitura será imutável após o envio.</Text>
    <SensorSelector value={sensor} cropAreaId={scope.kind === 'cropArea' ? scope.cropAreaId : undefined} error={errors.sensorId} disabled={blocked || checking} onChange={next => {
      setSelection(next);
      const allowed = readingFieldsForType(next.sensorType);
      setValues(previous => {
        const updated = { ...previous, sensorId: next.id };
        for (const key of READING_MEASUREMENTS) if (!allowed.includes(key)) updated[key] = '';
        if (next.sensorType !== 'WEATHER_STATION') { updated.rainfallStartDate = ''; updated.rainfallStartTime = ''; }
        return updated;
      });
      setErrors({}); setSubmitError(null);
    }} />
    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Ao trocar o tipo de sensor, medições incompatíveis serão limpas.</Text>
    {values.sensorId !== null && sensorQuery.isPending && <LoadingState message="Consultando sensor…" />}
    {sensorQuery.isError && values.sensorId !== null && <ErrorState message={parseSensorError(sensorQuery.error)} onRetry={() => { void refreshAccess(); }} />}
    {sensor && !isSensorNotFound(sensorQuery.error) && <View style={{ gap: theme.spacing.md }}>
      {areaQuery.isPending && <LoadingState message="Verificando talhão…" />}
      {areaQuery.isError && <ErrorState message={parseCropAreaError(areaQuery.error)} onRetry={() => { void refreshAccess(); }} />}
      {sensor.status !== 'ACTIVE' && <Text accessibilityRole="alert" style={[theme.typography.body, { color: theme.colors.text }]}>Somente sensores ativos podem registrar leituras. Altere o status nos detalhes do sensor ou selecione outro sensor.</Text>}
      {areaQuery.data?.status === 'ARCHIVED' && !isCropAreaNotFound(areaQuery.error) && <Text accessibilityRole="alert" style={[theme.typography.body, { color: theme.colors.text }]}>Talhão arquivado. Reative-o nos detalhes antes de registrar leituras.</Text>}
      <AppButton title={checking ? 'Verificando disponibilidade…' : 'Atualizar sensor e talhão'} variant="secondary" loading={checking} disabled={blocked || sensorQuery.isFetching || areaQuery.isFetching} onPress={() => { void refreshAccess(); }} />
    </View>}
    {errors.measurements && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.danger }]}>{errors.measurements}</Text>}
    {readingFieldsForType(sensor?.sensorType).map(field => <AppInput key={field}
      label={`${readingMeasurementLabels[field]} (${readingMeasurementUnits[field]})${field === 'batteryPercent' || weather ? ' (opcional)' : ''}`}
      value={values[field]} onChangeText={value => change(field, value)} error={errors[field]} editable={!blocked}
      keyboardType={field === 'temperatureCelsius' ? 'numbers-and-punctuation' : 'decimal-pad'} autoCorrect={false} maxLength={32}
      hint={field === 'temperatureCelsius' ? 'De -50 a 70 °C. Use vírgula ou ponto, até 3 casas decimais.'
        : field === 'rainfallMillimeters' ? 'Mínimo 0 mm. Informe também o início do intervalo de chuva.' : 'De 0 a 100%. Use vírgula ou ponto, até 3 casas decimais.'} />)}
    {weather && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Informe pelo menos uma medição: temperatura, umidade do ar, umidade do solo ou chuva. A bateria é opcional.</Text>}
    <AppInput label="Data da medição (opcional)" value={values.measuredDate} onChangeText={value => change('measuredDate', value)} error={errors.measuredDate}
      editable={!blocked} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10}
      hint="Use o fuso do dispositivo. Se data e horário ficarem vazios, a API usará o horário atual." />
    <AppInput label="Horário da medição (opcional)" value={values.measuredTime} onChangeText={value => change('measuredTime', value)} error={errors.measuredTime}
      editable={!blocked} placeholder="HH:mm" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={12}
      hint="HH:mm ou HH:mm:ss. Preencha junto com a data. Limite de 5 minutos no futuro." />
    {weather && <>
      <AppInput label="Data de início do intervalo de chuva" value={values.rainfallStartDate} onChangeText={value => change('rainfallStartDate', value)} error={errors.rainfallStartDate}
        editable={!blocked} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} hint="Obrigatória quando houver chuva, inclusive 0 mm." />
      <AppInput label="Horário de início do intervalo de chuva" value={values.rainfallStartTime} onChangeText={value => change('rainfallStartTime', value)} error={errors.rainfallStartTime}
        editable={!blocked} placeholder="HH:mm" keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={12} hint="Horário local anterior à medição. Deixe vazio quando não informar chuva." />
    </>}
    {submitError && <ErrorState title="Não foi possível registrar a leitura" message={submitError} />}
    <AppButton title={pending ? 'Registrando…' : 'Registrar leitura'} loading={pending} disabled={blocked || checking || (values.sensorId !== null && !canRegister)} onPress={() => { void submit(); }} />
    <AppButton title="Cancelar" variant="secondary" disabled={blocked || checking} onPress={() => navigation.goBack()} />
  </ScreenContainer>;
}
