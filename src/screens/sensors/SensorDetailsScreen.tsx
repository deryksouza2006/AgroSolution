import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SensorHealthPanel } from '../../components/sensors/SensorHealthPanel';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useDeleteSensor } from '../../hooks/sensors/useDeleteSensor';
import { useSensor } from '../../hooks/sensors/useSensor';
import { useSensorHealth } from '../../hooks/sensors/useSensorHealth';
import { useTheme } from '../../hooks/useTheme';
import type { Sensor } from '../../types/sensor';
import type { SensorsStackParamList } from '../../types/navigation';
import { isSensorNotFound, parseSensorError } from '../../utils/sensorErrors';
import { formatSensorStatus, formatSensorType } from '../../utils/sensorFormatting';
import { sensorDateToInput } from '../../utils/sensorValidation';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';

export function SensorDetailsScreen({ route, navigation }: NativeStackScreenProps<SensorsStackParamList, 'SensorDetails'>) {
  const { theme } = useTheme();
  const focused = useIsFocused();
  const deletion = useDeleteSensor();
  const query = useSensor(route.params.id, !deletion.isPending && !deletion.isSuccess);
  const [lastLoaded, setLastLoaded] = useState<Sensor>();
  const sensor = query.data ?? lastLoaded;
  const healthEnabled = focused && Boolean(sensor) && !isSensorNotFound(query.error) && !deletion.isPending && !deletion.isSuccess;
  const health = useSensorHealth(route.params.id, healthEnabled);
  const [actionError, setActionError] = useState<string | null>(null);
  const mounted = useRef(false);
  const working = useRef(false);
  const confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (query.data) setLastLoaded(query.data); }, [query.data]);
  const blocked = deletion.isPending || deletion.isSuccess;
  const remove = async () => {
    if (!mounted.current || working.current || !sensor) return;
    working.current = true;
    setActionError(null);
    try {
      await deletion.mutateAsync({ id: sensor.id, cropAreaId: sensor.cropAreaId, farmId: sensor.farmId });
      if (mounted.current) navigation.popTo('SensorList');
    } catch (error: unknown) {
      if (mounted.current) setActionError(parseSensorError(error, 'delete'));
    } finally { working.current = false; }
  };
  const confirmDelete = () => {
    if (!sensor || blocked || working.current || confirming.current) return;
    confirming.current = true;
    Alert.alert('Excluir sensor?', `Excluir “${sensor.name}” permanentemente? Sensores com leituras vinculadas não podem ser excluídos.`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Excluir permanentemente', style: 'destructive', onPress: () => { confirming.current = false; void remove(); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };
  const refresh = () => {
    if (blocked) return;
    if (!query.isFetching) void query.refetch();
    if (healthEnabled && !health.isFetching) void health.refetch();
  };
  if (query.isPending && !sensor) return <ScreenContainer><LoadingState message="Carregando sensor…" /></ScreenContainer>;
  if (!sensor || isSensorNotFound(query.error)) return <ScreenContainer><ErrorState message={parseSensorError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  const fields = [
    ['Código do dispositivo', sensor.deviceCode], ['Tipo de sensor', formatSensorType(sensor.sensorType)],
    ['Status administrativo', formatSensorStatus(sensor.status)], ['Talhão', sensor.cropAreaName], ['Propriedade', sensor.farmName],
    ['Data de instalação', sensorDateToInput(sensor.installationDate) || 'Não informada'],
    ['Descrição', sensor.description || 'Não informada'], ['Criado em', formatCropAreaDate(sensor.createdAt)],
    ['Atualizado em', formatCropAreaDate(sensor.updatedAt)],
  ];
  return <ScreenContainer refreshing={query.isRefetching || health.isRefetching} onRefresh={refresh}>
    {query.isError && <ErrorState title="Não foi possível atualizar o sensor" message={parseSensorError(query.error)} onRetry={() => { void query.refetch(); }} />}
    <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large }}>
      <Text accessibilityRole="header" style={[theme.typography.hero, { color: theme.colors.text }]}>{sensor.name}</Text>
      {fields.map(([label, value]) => <View key={label} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
      </View>)}
    </View>
    {health.isPending && !health.data && <LoadingState message="Consultando saúde do sensor…" />}
    {health.isError && <ErrorState title="Não foi possível consultar a saúde" message={parseSensorError(health.error)} onRetry={() => { if (healthEnabled) void health.refetch(); }} />}
    {health.isError && health.data && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo a última consulta de saúde disponível.</Text>}
    {health.data && <SensorHealthPanel health={health.data} />}
    <AppButton title="Atualizar dados e saúde" variant="secondary" disabled={blocked || query.isFetching || health.isFetching} onPress={refresh} />
    {actionError && <ErrorState title="Não foi possível excluir o sensor" message={actionError} />}
    <AppButton title="Ver leituras" variant="secondary" disabled={blocked}
      onPress={() => navigation.navigate('Readings', { scope: { kind: 'sensor', sensorId: sensor.id, sensorName: sensor.name } })} />
    <AppButton title="Registrar leitura" disabled={blocked || sensor.status !== 'ACTIVE'}
      onPress={() => navigation.navigate('Readings', { scope: { kind: 'sensor', sensorId: sensor.id, sensorName: sensor.name }, registerSensorId: sensor.id })} />
    <AppButton title="Editar sensor" variant="secondary" disabled={blocked} onPress={() => navigation.navigate('SensorEdit', { id: sensor.id, listCropAreaId: route.params.listCropAreaId })} />
    <AppButton title={deletion.isPending ? 'Excluindo…' : 'Excluir sensor'} variant="danger" loading={deletion.isPending} disabled={blocked} onPress={confirmDelete} />
  </ScreenContainer>;
}
