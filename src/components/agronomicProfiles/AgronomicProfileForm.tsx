import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Switch, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSaveAgronomicProfile } from '../../hooks/agronomicProfiles/useSaveAgronomicProfile';
import { useTheme } from '../../hooks/useTheme';
import type { AgronomicProfile, AgronomicProfileFormErrors, AgronomicProfileFormValues, AgronomicProfileRequest } from '../../types/agronomicProfile';
import type { CropAreasStackParamList } from '../../types/navigation';
import { toAgronomicDecimalInput, toAgronomicProfileRequest } from '../../utils/agronomicProfileValidation';
import { parseApiError, parseApiFieldErrors } from '../../utils/errors';
import { AppButton } from '../AppButton';
import { AppInput } from '../AppInput';
import { ScreenContainer } from '../ScreenContainer';
import { ErrorState } from '../feedback/ErrorState';
import { AgronomicProfileDemoNotice } from './AgronomicProfileDemoNotice';

interface Props {
  cropAreaId: number;
  initialProfile: AgronomicProfile | null;
  navigation: NativeStackNavigationProp<CropAreasStackParamList, 'AgronomicProfileForm'>;
  loadError?: string;
  onRetryLoad: () => void;
}

export function AgronomicProfileForm({ cropAreaId, initialProfile, navigation, loadError, onRetryLoad }: Props) {
  const { theme } = useTheme();
  const mutation = useSaveAgronomicProfile(cropAreaId);
  const [baseProfile] = useState(initialProfile);
  const [initialValues] = useState<AgronomicProfileFormValues>(() => ({
    soilTexture: initialProfile?.soilTexture ?? '',
    fieldCapacityPercent: initialProfile ? toAgronomicDecimalInput(initialProfile.fieldCapacityPercent) : '',
    wiltingPointPercent: initialProfile ? toAgronomicDecimalInput(initialProfile.wiltingPointPercent) : '',
    rootDepthCentimeters: initialProfile?.rootDepthCentimeters == null ? '' : toAgronomicDecimalInput(initialProfile.rootDepthCentimeters),
    sensorDepthCentimeters: initialProfile?.sensorDepthCentimeters == null ? '' : toAgronomicDecimalInput(initialProfile.sensorDepthCentimeters),
    source: initialProfile?.source ?? '', demo: initialProfile?.demo ?? false,
  }));
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<AgronomicProfileFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<AgronomicProfile | null>(null);
  const mounted = useRef(false);
  const submitting = useRef(false);
  const confirming = useRef(false);
  const leaving = useRef(false);
  const blocked = mutation.isPending || saved !== null;
  const dirty = (Object.keys(initialValues) as (keyof AgronomicProfileFormValues)[]).some(key => values[key] !== initialValues[key]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  usePreventRemove(!saved && (dirty || mutation.isPending), ({ data }) => {
    if (submitting.current || mutation.isPending) { Alert.alert('Salvando revisão', 'Aguarde a conclusão do envio antes de sair.'); return; }
    if (leaving.current || confirming.current) return;
    leaving.current = true;
    Alert.alert('Descartar alterações?', 'Você possui alterações não salvas no perfil agronômico.', [
      { text: 'Continuar editando', style: 'cancel', onPress: () => { leaving.current = false; } },
      { text: 'Descartar', style: 'destructive', onPress: () => {
        leaving.current = false;
        if (mounted.current) navigation.dispatch(data.action);
      } },
    ], { cancelable: true, onDismiss: () => { leaving.current = false; } });
  });

  useEffect(() => {
    if (saved) navigation.popTo('AgronomicProfile', { cropAreaId });
  }, [saved, navigation, cropAreaId]);

  const change = <Key extends keyof AgronomicProfileFormValues>(key: Key, value: AgronomicProfileFormValues[Key]) => {
    setValues(previous => ({ ...previous, [key]: value }));
    setErrors(previous => ({ ...previous, [key]: undefined }));
  };

  const save = async (input: AgronomicProfileRequest) => {
    if (!mounted.current || submitting.current || blocked) return;
    submitting.current = true;
    setSubmitError(null);
    Keyboard.dismiss();
    try {
      const profile = await mutation.mutateAsync(input);
      if (mounted.current) setSaved(profile);
    } catch (error: unknown) {
      if (!mounted.current) return;
      setSubmitError(parseApiError(error));
      const fields = parseApiFieldErrors(error);
      const fieldErrors: AgronomicProfileFormErrors = {};
      for (const key of Object.keys(initialValues) as (keyof AgronomicProfileFormValues)[]) if (fields[key]) fieldErrors[key] = fields[key];
      setErrors(fieldErrors);
    } finally { submitting.current = false; }
  };

  const confirmSave = () => {
    if (blocked || submitting.current || confirming.current) return;
    const result = toAgronomicProfileRequest(values);
    setSubmitError(null);
    if (!result.valid) { setErrors(result.errors); return; }
    setErrors({});
    confirming.current = true;
    Keyboard.dismiss();
    Alert.alert(baseProfile ? 'Criar nova revisão?' : 'Criar perfil agronômico?',
      baseProfile ? `Você está editando os dados da revisão ${baseProfile.revision}. O salvamento criará uma nova revisão e preservará a anterior. Confirma o envio?`
        : 'O salvamento criará uma revisão do perfil agronômico com os dados preenchidos. Confirma o envio?', [
        { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
        { text: baseProfile ? 'Salvar nova revisão' : 'Criar perfil', onPress: () => { confirming.current = false; void save(result.data); } },
      ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };

  return <ScreenContainer keyboard>
    {loadError && <ErrorState title="Não foi possível atualizar o perfil" message={loadError} onRetry={onRetryLoad} />}
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{baseProfile ? `Dados da revisão ${baseProfile.revision}` : 'Criar perfil agronômico'}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{baseProfile
      ? 'Salvar criará uma nova revisão. A revisão anterior será preservada. A numeração da nova revisão será definida pelo servidor.'
      : 'Informe os dados do perfil. Os campos de profundidade são opcionais.'}</Text>
    <AppInput label="Textura do solo" value={values.soilTexture} onChangeText={value => change('soilTexture', value)} error={errors.soilTexture} editable={!blocked} hint="Obrigatória, até 100 caracteres." />
    <AppInput label="Capacidade de campo (%)" value={values.fieldCapacityPercent} onChangeText={value => change('fieldCapacityPercent', value)} error={errors.fieldCapacityPercent} editable={!blocked} keyboardType="decimal-pad" hint="De 0 a 100. Deve ser maior que o ponto de murcha." />
    <AppInput label="Ponto de murcha (%)" value={values.wiltingPointPercent} onChangeText={value => change('wiltingPointPercent', value)} error={errors.wiltingPointPercent} editable={!blocked} keyboardType="decimal-pad" hint="De 0 a 100. Aceita vírgula ou ponto nos decimais." />
    <AppInput label="Profundidade das raízes (cm)" value={values.rootDepthCentimeters} onChangeText={value => change('rootDepthCentimeters', value)} error={errors.rootDepthCentimeters} editable={!blocked} keyboardType="decimal-pad" hint="Opcional. Informe um valor positivo ou deixe vazio." />
    <AppInput label="Profundidade do sensor (cm)" value={values.sensorDepthCentimeters} onChangeText={value => change('sensorDepthCentimeters', value)} error={errors.sensorDepthCentimeters} editable={!blocked} keyboardType="decimal-pad" hint="Opcional. Informe um valor positivo ou deixe vazio." />
    <AppInput label="Fonte dos dados" value={values.source} onChangeText={value => change('source', value)} error={errors.source} editable={!blocked} multiline textAlignVertical="top" style={{ minHeight: 120 }} hint={`Obrigatória. ${values.source.length}/500 caracteres.`} />
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, minHeight: 48 }}>
        <Text style={[theme.typography.label, { flex: 1, color: theme.colors.text }]}>Dados demonstrativos</Text>
        <Switch value={values.demo} onValueChange={value => change('demo', value)} disabled={blocked}
          accessibilityLabel="Dados demonstrativos" accessibilityState={{ checked: values.demo, disabled: blocked }}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }} style={{ minWidth: 48, minHeight: 48 }} />
      </View>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Ative somente quando os dados informados forem demonstrativos.</Text>
      {errors.demo && <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.danger }]}>{errors.demo}</Text>}
      {values.demo && <AgronomicProfileDemoNotice />}
    </View>
    {submitError && <ErrorState title="Não foi possível salvar a revisão" message={submitError} />}
    <AppButton title={mutation.isPending ? 'Salvando revisão…' : baseProfile ? 'Salvar nova revisão' : 'Criar perfil'} loading={mutation.isPending} disabled={blocked} onPress={confirmSave} />
    <AppButton title="Cancelar" variant="secondary" disabled={blocked} onPress={() => navigation.goBack()} />
  </ScreenContainer>;
}
