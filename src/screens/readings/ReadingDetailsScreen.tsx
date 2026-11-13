import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ReadingMeasurements } from '../../components/readings/ReadingMeasurements';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useDeleteReading } from '../../hooks/readings/useDeleteReading';
import { useReading } from '../../hooks/readings/useReading';
import { useTheme } from '../../hooks/useTheme';
import type { Reading } from '../../types/reading';
import type { ReadingsStackParamList } from '../../types/navigation';
import { isReadingNotFound, parseReadingError, readingConflict } from '../../utils/readingErrors';
import { formatReadingAnalysisStatus, formatReadingSource, isSimulatedReading } from '../../utils/readingFormatting';
import { formatSensorType } from '../../utils/sensorFormatting';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';

export function ReadingDetailsScreen({ route, navigation }: NativeStackScreenProps<ReadingsStackParamList, 'ReadingDetails'>) {
  const { theme } = useTheme();
  const deletion = useDeleteReading();
  const query = useReading(route.params.id, !deletion.isPending && !deletion.isSuccess);
  const [lastLoaded, setLastLoaded] = useState<Reading>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [analyzedConflict, setAnalyzedConflict] = useState(false);
  const mounted = useRef(false), working = useRef(false), confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (query.data) setLastLoaded(query.data); }, [query.data]);
  const reading = query.data ?? lastLoaded;
  const analyzed = reading?.analysisStatus === 'ANALYZED' || analyzedConflict;
  const blocked = deletion.isPending || deletion.isSuccess || analyzed;
  const remove = async () => {
    if (!mounted.current || working.current || !reading || blocked) return;
    working.current = true;
    setActionError(null);
    try {
      await deletion.mutateAsync({ id: reading.id, sensorId: reading.sensorId, cropAreaId: reading.cropAreaId });
      if (mounted.current) navigation.popTo('ReadingList', { scope: route.params.scope });
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(parseReadingError(error));
        if (readingConflict(error) === 'analyzed') { setAnalyzedConflict(true); void query.refetch(); }
      }
    } finally { working.current = false; }
  };
  const confirmDelete = () => {
    if (!reading || blocked || working.current || confirming.current) return;
    confirming.current = true;
    Alert.alert('Excluir leitura?', `Excluir permanentemente a leitura de “${reading.sensorName}”, medida em ${formatCropAreaDate(reading.measuredAt)}? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Excluir permanentemente', style: 'destructive', onPress: () => { confirming.current = false; void remove(); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };
  if (query.isPending && !reading) return <ScreenContainer><LoadingState message="Carregando leitura…" /></ScreenContainer>;
  if (!reading || isReadingNotFound(query.error)) return <ScreenContainer><ErrorState message={parseReadingError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  const fields = [
    ['Identificador', String(reading.id)], ['Sensor', reading.sensorName], ['Tipo de sensor', formatSensorType(reading.sensorType)],
    ['Talhão', reading.cropAreaName], ['Propriedade', reading.farmName], ['Medição em', formatCropAreaDate(reading.measuredAt)],
    ['Origem', formatReadingSource(reading.source)], ['Processamento técnico da leitura', formatReadingAnalysisStatus(reading.analysisStatus)],
    ['Criada em', formatCropAreaDate(reading.createdAt)], ['Atualizada em', formatCropAreaDate(reading.updatedAt)],
  ];
  return <ScreenContainer refreshing={query.isRefetching} onRefresh={() => { if (!deletion.isPending && !deletion.isSuccess && !query.isFetching) void query.refetch(); }}>
    {query.isError && <ErrorState title="Não foi possível atualizar a leitura" message={parseReadingError(query.error)} onRetry={() => { void query.refetch(); }} />}
    <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large }}>
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Leitura de {reading.sensorName}</Text>
      {isSimulatedReading(reading) && <Text style={[theme.typography.label, { color: theme.colors.text }]}>Dados simulados</Text>}
      <ReadingMeasurements reading={reading} />
      {fields.map(([label, value]) => <View key={label} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
      </View>)}
    </View>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>O processamento técnico indica uma etapa interna do servidor. Não é uma avaliação agronômica ou de risco hídrico.</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{analyzed ? 'Leituras com processamento concluído (ANALYZED) não podem ser excluídas.' : 'Leituras são imutáveis. A exclusão depende do processamento atual no servidor.'}</Text>
    {actionError && <ErrorState title="Não foi possível excluir a leitura" message={actionError} />}
    <AppButton title="Atualizar leitura" variant="secondary" disabled={deletion.isPending || deletion.isSuccess || query.isFetching} onPress={() => { void query.refetch(); }} />
    <AppButton title={deletion.isPending ? 'Excluindo…' : 'Excluir leitura'} variant="danger" loading={deletion.isPending} disabled={blocked} onPress={confirmDelete} />
  </ScreenContainer>;
}
