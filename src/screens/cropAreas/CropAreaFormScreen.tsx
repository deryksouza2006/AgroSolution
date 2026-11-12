import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Text } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AreaUnitSelector } from '../../components/AreaUnitSelector';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FarmSelector } from '../../components/farms/FarmSelector';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useCreateCropArea } from '../../hooks/cropAreas/useCreateCropArea';
import { useCropArea } from '../../hooks/cropAreas/useCropArea';
import { useUpdateCropArea } from '../../hooks/cropAreas/useUpdateCropArea';
import { useFarm } from '../../hooks/farms/useFarm';
import { useTheme } from '../../hooks/useTheme';
import type { CropArea, CropAreaFormErrors, CropAreaFormValues, CropAreaSelection } from '../../types/cropArea';
import type { CropAreasStackParamList } from '../../types/navigation';
import { isCropAreaNotFound, parseCropAreaError } from '../../utils/cropAreaErrors';
import { toCropAreaRequest } from '../../utils/cropAreaValidation';
import { parseApiFieldErrors } from '../../utils/errors';
import { parseFarmError } from '../../utils/farmErrors';

type Props = NativeStackScreenProps<CropAreasStackParamList, 'CropAreaCreate'>
  | NativeStackScreenProps<CropAreasStackParamList, 'CropAreaEdit'>;
const emptyValues: CropAreaFormValues = {
  farmId: null, name: '', cropType: '', areaSize: '', areaUnit: '', latitude: '', longitude: '', description: '',
};

function CropAreaForm({ navigation, initialArea, initialFarm, listFarmId, loadError, onRetryLoad }: {
  navigation: Props['navigation']; initialArea?: CropArea; initialFarm?: CropAreaSelection;
  listFarmId?: number; loadError?: string; onRetryLoad?: () => void;
}) {
  const { theme } = useTheme();
  const create = useCreateCropArea();
  const update = useUpdateCropArea();
  const [initialValues] = useState<CropAreaFormValues>(() => initialArea ? {
    farmId: initialArea.farmId, name: initialArea.name, cropType: initialArea.cropType,
    areaSize: String(initialArea.areaSize).replace('.', ','), areaUnit: initialArea.areaUnit,
    latitude: initialArea.latitude === null ? '' : String(initialArea.latitude).replace('.', ','),
    longitude: initialArea.longitude === null ? '' : String(initialArea.longitude).replace('.', ','),
    description: initialArea.description ?? '',
  } : { ...emptyValues, farmId: initialFarm?.id ?? null });
  const [values, setValues] = useState(initialValues);
  const [selectedFarm, setSelectedFarm] = useState<CropAreaSelection | null>(() => initialArea
    ? { id: initialArea.farmId, name: initialArea.farmName } : initialFarm ?? null);
  const [errors, setErrors] = useState<CropAreaFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<CropArea | null>(null);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const confirming = useRef(false);
  const pending = create.isPending || update.isPending;
  const dirty = (Object.keys(initialValues) as (keyof CropAreaFormValues)[]).some(key => values[key] !== initialValues[key]);
  const blocked = pending || saved !== null;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  usePreventRemove(!saved && (dirty || pending), ({ data }) => {
    if (pending || submitting.current) {
      Alert.alert('Salvando talhão', 'Aguarde a conclusão do envio antes de sair.');
      return;
    }
    if (confirming.current) return;
    confirming.current = true;
    Alert.alert('Descartar alterações?', 'Você possui alterações não salvas neste talhão.', [
      { text: 'Continuar editando', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => {
        confirming.current = false;
        if (mounted.current) navigation.dispatch(data.action);
      } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  });

  useEffect(() => {
    if (!saved) return;
    const params = { id: saved.id, listFarmId };
    if (initialArea) navigation.popTo('CropAreaDetails', params);
    else navigation.replace('CropAreaDetails', params);
  }, [saved, initialArea, navigation, listFarmId]);

  const change = <Key extends keyof CropAreaFormValues>(key: Key, value: CropAreaFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };

  const submit = async () => {
    if (submitting.current || blocked) return;
    const request = toCropAreaRequest(values);
    setSubmitError(null);
    if (!request.valid) { setErrors(request.errors); return; }
    setErrors({});
    submitting.current = true;
    Keyboard.dismiss();
    try {
      const result = initialArea
        ? await update.mutateAsync({ id: initialArea.id, previousFarmId: initialValues.farmId ?? initialArea.farmId, input: request.data })
        : await create.mutateAsync(request.data);
      if (mounted.current) setSaved(result);
    } catch (error: unknown) {
      if (!mounted.current) return;
      setSubmitError(parseCropAreaError(error, 'save'));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: CropAreaFormErrors = {};
      for (const key of Object.keys(emptyValues) as (keyof CropAreaFormValues)[]) {
        if (fields[key]) fieldErrors[key] = fields[key];
      }
      setErrors(fieldErrors);
    } finally { submitting.current = false; }
  };

  return <ScreenContainer keyboard>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Propriedade, nome, cultivo, área e unidade são obrigatórios. Coordenadas e descrição são opcionais.</Text>
    {loadError && <ErrorState title="Não foi possível atualizar os dados" message={loadError} onRetry={onRetryLoad} />}
    <FarmSelector value={selectedFarm} disabled={blocked} error={errors.farmId} onChange={farm => {
      setSelectedFarm(farm); change('farmId', farm.id);
    }} />
    {initialArea && values.farmId !== initialValues.farmId && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.text }]}>Ao salvar, o talhão será transferido para {selectedFarm?.name}. A capacidade da propriedade será validada pelo servidor.</Text>}
    <AppInput label="Nome do talhão" value={values.name} onChangeText={value => change('name', value)} error={errors.name} editable={!blocked} autoCapitalize="words" />
    <AppInput label="Cultivo" value={values.cropType} onChangeText={value => change('cropType', value)} error={errors.cropType} editable={!blocked} autoCapitalize="sentences" />
    <AppInput label="Área do talhão" value={values.areaSize} onChangeText={value => change('areaSize', value)} error={errors.areaSize}
      editable={!blocked} keyboardType="decimal-pad" maxLength={32} hint="Use vírgula ou ponto e até 2 casas decimais, sem separador de milhar." />
    <AreaUnitSelector value={values.areaUnit} onChange={value => change('areaUnit', value)} error={errors.areaUnit} disabled={blocked} />
    <AppInput label="Latitude (opcional)" value={values.latitude} onChangeText={value => change('latitude', value)} error={errors.latitude}
      editable={!blocked} keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={24} hint="De -90 a 90. Até 6 casas decimais; use o sinal de menos quando necessário." />
    <AppInput label="Longitude (opcional)" value={values.longitude} onChangeText={value => change('longitude', value)} error={errors.longitude}
      editable={!blocked} keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={24} hint="De -180 a 180. Preencha junto com a latitude ou deixe ambas vazias." />
    <AppInput label="Descrição (opcional)" value={values.description} onChangeText={value => change('description', value)} error={errors.description}
      editable={!blocked} multiline textAlignVertical="top" style={{ minHeight: 120 }} hint={`${values.description.length}/500 caracteres`} />
    {submitError && <ErrorState title="Não foi possível salvar o talhão" message={submitError} />}
    <AppButton title={pending ? 'Salvando…' : initialArea ? 'Salvar alterações' : 'Cadastrar talhão'} loading={pending} disabled={blocked} onPress={() => { void submit(); }} />
    <AppButton title="Cancelar" variant="secondary" disabled={blocked} onPress={() => navigation.goBack()} />
  </ScreenContainer>;
}

export function CropAreaFormScreen({ route, navigation }: Props) {
  const editing = route.name === 'CropAreaEdit';
  const id = route.name === 'CropAreaEdit' ? route.params.id : undefined;
  const farmId = route.name === 'CropAreaCreate' ? route.params?.farmId : undefined;
  const query = useCropArea(id);
  const farm = useFarm(farmId);
  if (editing) {
    if (query.isPending) return <ScreenContainer><LoadingState message="Carregando talhão…" /></ScreenContainer>;
    if (!query.data || isCropAreaNotFound(query.error)) return <ScreenContainer><ErrorState message={parseCropAreaError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
    return <CropAreaForm navigation={navigation} initialArea={query.data}
      listFarmId={route.name === 'CropAreaEdit' ? route.params.listFarmId : undefined}
      loadError={query.isError ? parseCropAreaError(query.error) : undefined} onRetryLoad={() => { void query.refetch(); }} />;
  }
  if (farmId !== undefined && farm.isPending) return <ScreenContainer><LoadingState message="Carregando propriedade…" /></ScreenContainer>;
  if (farmId !== undefined && !farm.data) return <ScreenContainer><ErrorState message={parseFarmError(farm.error)} onRetry={() => { void farm.refetch(); }} /></ScreenContainer>;
  return <CropAreaForm navigation={navigation} initialFarm={farm.data ? { id: farm.data.id, name: farm.data.name } : undefined}
    listFarmId={farmId} loadError={farm.isError ? parseFarmError(farm.error) : undefined} onRetryLoad={() => { void farm.refetch(); }} />;
}
