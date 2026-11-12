import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Text } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CropAreaSelector, type CropAreaSensorSelection } from '../../components/cropAreas/CropAreaSelector';
import { SensorOptionSelector } from '../../components/sensors/SensorOptionSelector';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useCropArea } from '../../hooks/cropAreas/useCropArea';
import { useCreateSensor } from '../../hooks/sensors/useCreateSensor';
import { useSensor } from '../../hooks/sensors/useSensor';
import { useUpdateSensor } from '../../hooks/sensors/useUpdateSensor';
import { useTheme } from '../../hooks/useTheme';
import type { Sensor, SensorFormErrors, SensorFormValues } from '../../types/sensor';
import type { SensorsStackParamList } from '../../types/navigation';
import { isCropAreaNotFound, parseCropAreaError } from '../../utils/cropAreaErrors';
import { parseApiFieldErrors } from '../../utils/errors';
import { isSensorNotFound, parseSensorError, sensorConflict } from '../../utils/sensorErrors';
import { sensorDateToInput, toSensorCreateRequest, toSensorUpdateRequest } from '../../utils/sensorValidation';

type Props = NativeStackScreenProps<SensorsStackParamList, 'SensorCreate'> | NativeStackScreenProps<SensorsStackParamList, 'SensorEdit'>;
const emptyValues: SensorFormValues = { cropAreaId: null, name: '', deviceCode: '', sensorType: '', status: 'ACTIVE', installationDate: '', description: '' };
function SensorForm({ navigation, initialSensor, initialCropArea, listCropAreaId, loadError, onRetryLoad }: {
  navigation: Props['navigation']; initialSensor?: Sensor; initialCropArea?: CropAreaSensorSelection;
  listCropAreaId?: number; loadError?: string; onRetryLoad: () => void;
}) {
  const { theme } = useTheme();
  const create = useCreateSensor();
  const update = useUpdateSensor();
  const [initialValues] = useState<SensorFormValues>(() => initialSensor ? {
    cropAreaId: initialSensor.cropAreaId, name: initialSensor.name, deviceCode: initialSensor.deviceCode.toUpperCase(),
    sensorType: initialSensor.sensorType, status: initialSensor.status,
    installationDate: sensorDateToInput(initialSensor.installationDate), description: initialSensor.description ?? '',
  } : { ...emptyValues, cropAreaId: initialCropArea?.id ?? null });
  const [values, setValues] = useState(initialValues);
  const [selectedCropArea, setSelectedCropArea] = useState<CropAreaSensorSelection | null>(() => initialSensor
    ? { id: initialSensor.cropAreaId, name: initialSensor.cropAreaName, farmId: initialSensor.farmId, farmName: initialSensor.farmName }
    : initialCropArea ?? null);
  const [errors, setErrors] = useState<SensorFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Sensor | null>(null);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const confirming = useRef(false);
  const pending = create.isPending || update.isPending;
  const dirty = (Object.keys(initialValues) as (keyof SensorFormValues)[]).some(key => values[key] !== initialValues[key]);
  const blocked = pending || saved !== null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  usePreventRemove(!saved && (dirty || pending), ({ data }) => {
    if (pending || submitting.current) { Alert.alert('Salvando sensor', 'Aguarde a conclusão do envio antes de sair.'); return; }
    if (confirming.current) return;
    confirming.current = true;
    Alert.alert('Descartar alterações?', 'Você possui alterações não salvas neste sensor.', [
      { text: 'Continuar editando', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => { confirming.current = false; if (mounted.current) navigation.dispatch(data.action); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  });
  useEffect(() => {
    if (!saved) return;
    const params = { id: saved.id, listCropAreaId };
    if (initialSensor) navigation.popTo('SensorDetails', params);
    else navigation.replace('SensorDetails', params);
  }, [saved, initialSensor, navigation, listCropAreaId]);
  const change = <Key extends keyof SensorFormValues>(key: Key, value: SensorFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };
  const submit = async () => {
    if (submitting.current || blocked) return;
    setSubmitError(null);
    let send: () => Promise<Sensor>;
    if (initialSensor) {
      const request = toSensorUpdateRequest(values, initialSensor.deviceCode);
      if (!request.valid) { setErrors(request.errors); return; }
      send = () => update.mutateAsync({ id: initialSensor.id, previousCropAreaId: initialSensor.cropAreaId,
        previousFarmId: initialSensor.farmId, input: request.data });
    } else {
      const request = toSensorCreateRequest(values);
      if (!request.valid) { setErrors(request.errors); return; }
      send = () => create.mutateAsync(request.data);
    }
    setErrors({});
    submitting.current = true;
    Keyboard.dismiss();
    try {
      const result = await send();
      if (mounted.current) setSaved(result);
    } catch (error: unknown) {
      if (!mounted.current) return;
      setSubmitError(parseSensorError(error, 'save'));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: SensorFormErrors = {};
      for (const key of Object.keys(emptyValues) as (keyof SensorFormValues)[]) if (fields[key]) fieldErrors[key] = fields[key];
      if (sensorConflict(error) === 'duplicate-code') fieldErrors.deviceCode = 'Código de dispositivo já cadastrado. Informe outro código.';
      setErrors(fieldErrors);
    } finally { submitting.current = false; }
  };
  return <ScreenContainer keyboard>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Selecione um talhão e informe nome, código do dispositivo e tipo. {initialSensor ? 'O status administrativo pode ser alterado aqui.' : 'O sensor será cadastrado com status Ativo.'}</Text>
    {loadError && <ErrorState title="Não foi possível atualizar os dados" message={loadError} onRetry={onRetryLoad} />}
    <CropAreaSelector value={selectedCropArea} error={errors.cropAreaId} disabled={blocked} onChange={area => {
      setSelectedCropArea(area); change('cropAreaId', area?.id ?? null);
    }} />
    {initialSensor && values.cropAreaId !== initialValues.cropAreaId && selectedCropArea && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.text }]}>Ao salvar, o sensor será transferido para {selectedCropArea.name}, em {selectedCropArea.farmName}.</Text>}
    <AppInput label="Nome do sensor" value={values.name} onChangeText={value => change('name', value)} error={errors.name} editable={!blocked} autoCapitalize="words" />
    <AppInput label="Código do dispositivo" value={values.deviceCode} onChangeText={value => change('deviceCode', value.toUpperCase())} error={errors.deviceCode}
      editable={!blocked} autoCapitalize="characters" autoCorrect={false} hint={initialSensor ? 'De 3 a 80 caracteres. Deixe vazio para preservar o código atual. O código é único em todo o sistema.' : 'De 3 a 80 caracteres, em maiúsculas. O código é único em todo o sistema.'} />
    <SensorOptionSelector kind="type" value={values.sensorType} onChange={value => change('sensorType', value)} error={errors.sensorType} disabled={blocked} />
    {initialSensor && <SensorOptionSelector kind="status" value={values.status} onChange={value => change('status', value)} error={errors.status} disabled={blocked} />}
    <AppInput label="Data de instalação (opcional)" value={values.installationDate} onChangeText={value => change('installationDate', value)} error={errors.installationDate}
      editable={!blocked} placeholder="DD/MM/AAAA" autoCorrect={false} keyboardType="numbers-and-punctuation" maxLength={10}
      hint={initialSensor ? 'DD/MM/AAAA, sem data futura. Deixe vazio para omitir o campo no envio.' : 'DD/MM/AAAA, sem data futura. Se vazia, a API usará a data atual.'} />
    <AppInput label="Descrição (opcional)" value={values.description} onChangeText={value => change('description', value)} error={errors.description}
      editable={!blocked} multiline textAlignVertical="top" style={{ minHeight: 120 }} hint={`${values.description.length}/500 caracteres`} />
    {submitError && <ErrorState title="Não foi possível salvar o sensor" message={submitError} />}
    <AppButton title={pending ? 'Salvando…' : initialSensor ? 'Salvar alterações' : 'Cadastrar sensor'} loading={pending} disabled={blocked} onPress={() => { void submit(); }} />
    <AppButton title="Cancelar" variant="secondary" disabled={blocked} onPress={() => navigation.goBack()} />
  </ScreenContainer>;
}
export function SensorFormScreen({ navigation, route }: Props) {
  const editing = route.name === 'SensorEdit';
  const id = route.name === 'SensorEdit' ? route.params.id : undefined;
  const cropAreaId = route.name === 'SensorCreate' ? route.params?.cropAreaId : undefined;
  const query = useSensor(id);
  const area = useCropArea(cropAreaId);
  if (editing) {
    if (query.isPending) return <ScreenContainer><LoadingState message="Carregando sensor…" /></ScreenContainer>;
    if (!query.data || isSensorNotFound(query.error)) return <ScreenContainer><ErrorState message={parseSensorError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
    return <SensorForm navigation={navigation} initialSensor={query.data} listCropAreaId={route.name === 'SensorEdit' ? route.params.listCropAreaId : undefined}
      loadError={query.isError ? parseSensorError(query.error) : undefined} onRetryLoad={() => { void query.refetch(); }} />;
  }
  if (cropAreaId !== undefined && area.isPending) return <ScreenContainer><LoadingState message="Carregando talhão…" /></ScreenContainer>;
  if (cropAreaId !== undefined && (!area.data || isCropAreaNotFound(area.error))) return <ScreenContainer><ErrorState message={parseCropAreaError(area.error)} onRetry={() => { void area.refetch(); }} /></ScreenContainer>;
  return <SensorForm navigation={navigation} initialCropArea={area.data ? { id: area.data.id, name: area.data.name, farmId: area.data.farmId, farmName: area.data.farmName } : undefined}
    listCropAreaId={cropAreaId} loadError={area.isError ? parseCropAreaError(area.error) : undefined} onRetryLoad={() => { void area.refetch(); }} />;
}
