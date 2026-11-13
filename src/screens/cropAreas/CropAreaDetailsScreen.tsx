import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CropAreaStatusBadge } from '../../components/cropAreas/CropAreaStatusBadge';
import { LatestReadingSummary } from '../../components/readings/LatestReadingSummary';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useArchiveCropArea } from '../../hooks/cropAreas/useArchiveCropArea';
import { useCropArea } from '../../hooks/cropAreas/useCropArea';
import { useDeleteCropArea } from '../../hooks/cropAreas/useDeleteCropArea';
import { useTheme } from '../../hooks/useTheme';
import type { CropArea } from '../../types/cropArea';
import type { CropAreasStackParamList } from '../../types/navigation';
import { cropAreaDeleteConflict, isCropAreaNotFound, parseCropAreaError } from '../../utils/cropAreaErrors';
import { formatCoordinate, formatCropAreaDate } from '../../utils/cropAreaFormatting';
import { formatArea, formatAreaUnit } from '../../utils/numberFormatting';

export function CropAreaDetailsScreen({ route, navigation }: NativeStackScreenProps<CropAreasStackParamList, 'CropAreaDetails'>) {
  const { theme } = useTheme();
  const focused = useIsFocused();
  const deletion = useDeleteCropArea();
  const archive = useArchiveCropArea();
  const query = useCropArea(route.params.id, !deletion.isPending && !deletion.isSuccess);
  const [lastLoaded, setLastLoaded] = useState<CropArea>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyConflict, setHistoryConflict] = useState(false);
  const mounted = useRef(false);
  const working = useRef(false);
  const confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (query.data) setLastLoaded(query.data); }, [query.data]);
  const area = query.data ?? lastLoaded;
  const pending = deletion.isPending || archive.isPending;
  const blocked = pending || deletion.isSuccess || query.isFetching || query.isError;

  const remove = async () => {
    if (!mounted.current || working.current || !area) return;
    working.current = true;
    setActionError(null);
    setHistoryConflict(false);
    try {
      await deletion.mutateAsync({ id: area.id, farmId: area.farmId });
      if (mounted.current) navigation.popTo('CropAreaList');
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(parseCropAreaError(error, 'delete'));
        setHistoryConflict(cropAreaDeleteConflict(error) === 'history');
      }
    } finally { working.current = false; }
  };

  const setArchived = async (archived: boolean) => {
    if (!mounted.current || working.current || !area) return;
    working.current = true;
    setActionError(null);
    try {
      await archive.mutateAsync({ id: area.id, farmId: area.farmId, archived });
      if (mounted.current) setHistoryConflict(false);
    } catch (error: unknown) {
      if (mounted.current) setActionError(parseCropAreaError(error, archived ? 'archive' : 'reactivate'));
    } finally { working.current = false; }
  };

  const confirm = (operation: 'delete' | 'archive' | 'reactivate') => {
    if (!area || blocked || working.current || confirming.current) return;
    confirming.current = true;
    const title = operation === 'delete' ? 'Excluir talhão?' : operation === 'archive' ? 'Arquivar talhão?' : 'Reativar talhão?';
    const message = operation === 'delete' ? `Excluir “${area.name}” permanentemente? Esta ação não pode ser desfeita.`
      : operation === 'archive' ? `Arquivar “${area.name}”? O cultivo e seu histórico serão preservados e o talhão continuará visível como arquivado.`
        : `Reativar “${area.name}”? A propriedade precisa ter capacidade disponível. O status será definido pelo servidor.`;
    const label = operation === 'delete' ? 'Excluir permanentemente' : operation === 'archive' ? 'Arquivar' : 'Reativar';
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: label, style: operation === 'delete' ? 'destructive' : 'default', onPress: () => {
        confirming.current = false;
        if (operation === 'delete') void remove();
        else void setArchived(operation === 'archive');
      } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };

  if (query.isPending && !area) return <ScreenContainer><LoadingState message="Carregando talhão…" /></ScreenContainer>;
  if (!area || isCropAreaNotFound(query.error)) return <ScreenContainer><ErrorState message={parseCropAreaError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  const archived = area.status === 'ARCHIVED';
  const fields = [
    { label: 'Identificador', value: String(area.id) }, { label: 'Cultivo', value: area.cropType },
    { label: 'Propriedade', value: area.farmName }, { label: 'Identificador da propriedade', value: String(area.farmId) },
    { label: 'Área', value: formatArea(area.areaSize) }, { label: 'Unidade', value: formatAreaUnit(area.areaUnit) },
    { label: 'Latitude', value: formatCoordinate(area.latitude) }, { label: 'Longitude', value: formatCoordinate(area.longitude) },
    { label: 'Descrição', value: area.description || 'Não informada' },
    { label: 'Criado em', value: formatCropAreaDate(area.createdAt) }, { label: 'Atualizado em', value: formatCropAreaDate(area.updatedAt) },
  ];
  return <ScreenContainer>
    {query.isError && <ErrorState title="Não foi possível atualizar o talhão" message={parseCropAreaError(query.error)} onRetry={() => { void query.refetch(); }} />}
    {query.isFetching && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Atualizando talhão…</Text>}
    <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large }}>
      <Text accessibilityRole="header" style={[theme.typography.hero, { color: theme.colors.text }]}>{area.name}</Text>
      <CropAreaStatusBadge status={area.status} />
      {fields.map(field => <View key={field.label} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{field.label}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{field.value}</Text>
      </View>)}
    </View>
    {actionError && <ErrorState title="Não foi possível concluir a ação" message={actionError} />}
    <LatestReadingSummary cropAreaId={area.id} enabled={focused && !pending && !deletion.isSuccess}
      onOpen={reading => navigation.navigate('Readings', { scope: { kind: 'cropArea', cropAreaId: area.id, cropAreaName: area.name }, readingId: reading.id })} />
    <AppButton title="Leituras do talhão" variant="secondary" disabled={pending || deletion.isSuccess}
      onPress={() => navigation.navigate('Readings', { scope: { kind: 'cropArea', cropAreaId: area.id, cropAreaName: area.name } })} />
    <AppButton title="Ver sensores" variant="secondary" disabled={pending || deletion.isSuccess}
      onPress={() => navigation.navigate('Sensors', { screen: 'SensorList', params: { cropAreaId: area.id, cropAreaName: area.name } })} />
    <AppButton title="Perfil agronômico" variant="secondary" disabled={pending || deletion.isSuccess}
      onPress={() => navigation.navigate('AgronomicProfile', { cropAreaId: area.id })} />
    <AppButton title="Diário agrícola" variant="secondary" disabled={pending || deletion.isSuccess}
      onPress={() => navigation.navigate('ActivityDiary', { cropAreaId: area.id, cropAreaName: area.name })} />
    <AppButton title="Editar" variant="secondary" disabled={blocked} onPress={() => navigation.navigate('CropAreaEdit', { id: area.id, listFarmId: route.params.listFarmId })} />
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{historyConflict ? 'O histórico impede a exclusão. Confirme o arquivamento para preservar o cultivo.' : 'Arquivar preserva os dados do cultivo. Excluir remove o talhão permanentemente.'}</Text>
    <AppButton title={archive.isPending ? 'Atualizando arquivamento…' : archived ? 'Reativar talhão' : 'Arquivar talhão'} variant="secondary" loading={archive.isPending} disabled={blocked}
      onPress={() => confirm(archived ? 'reactivate' : 'archive')} />
    <AppButton title={deletion.isPending ? 'Excluindo…' : 'Excluir permanentemente'} variant="danger" loading={deletion.isPending} disabled={blocked} onPress={() => confirm('delete')} />
  </ScreenContainer>;
}
