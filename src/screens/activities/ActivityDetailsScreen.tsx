import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ActivityAccessNotice } from '../../components/activities/ActivityAccessNotice';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useActivity } from '../../hooks/activities/useActivity';
import { useActivityAccess } from '../../hooks/activities/useActivityAccess';
import { useDeleteActivity } from '../../hooks/activities/useDeleteActivity';
import { useTheme } from '../../hooks/useTheme';
import type { Activity } from '../../types/activity';
import type { ActivitiesStackParamList } from '../../types/navigation';
import { isActivityNotFound, parseActivityError } from '../../utils/activityErrors';
import { formatActivityQuantity, formatActivityType } from '../../utils/activityFormatting';
import { formatCropAreaDate } from '../../utils/cropAreaFormatting';

export function ActivityDetailsScreen({ route, navigation }: NativeStackScreenProps<ActivitiesStackParamList, 'ActivityDetails'>) {
  const { theme } = useTheme();
  const { cropAreaId, id } = route.params;
  const access = useActivityAccess(cropAreaId);
  const deletion = useDeleteActivity(cropAreaId);
  const query = useActivity(cropAreaId, id, !deletion.isPending && !deletion.isSuccess);
  const [lastLoaded, setLastLoaded] = useState<Activity>();
  const [actionError, setActionError] = useState<string | null>(null);
  const mounted = useRef(false);
  const working = useRef(false);
  const confirming = useRef(false);
  const canWrite = useRef(access.canWrite);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { canWrite.current = access.canWrite; }, [access.canWrite]);
  useEffect(() => { if (query.data) setLastLoaded(query.data); }, [query.data]);
  const activity = query.data ?? lastLoaded;
  const blocked = !access.canWrite || deletion.isPending || deletion.isSuccess || query.isFetching || query.isError;

  const remove = async () => {
    if (!mounted.current || !canWrite.current || working.current) return;
    working.current = true;
    setActionError(null);
    try {
      await deletion.mutateAsync(id);
      if (mounted.current) navigation.popTo('ActivityList', { cropAreaId, cropAreaName: access.query.data?.name ?? 'Talhão' });
    } catch (error: unknown) {
      if (mounted.current) setActionError(parseActivityError(error));
    } finally { working.current = false; }
  };

  const confirmDelete = () => {
    if (blocked || confirming.current || working.current || !activity) return;
    confirming.current = true;
    Alert.alert('Excluir atividade?', `Excluir o registro de ${formatActivityType(activity.type).toLowerCase()} de ${formatCropAreaDate(activity.performedAt)}? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Excluir', style: 'destructive', onPress: () => { confirming.current = false; void remove(); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };

  if (query.isPending && !activity) return <ScreenContainer><LoadingState message="Carregando atividade…" /></ScreenContainer>;
  if (!activity || isActivityNotFound(query.error)) return <ScreenContainer><ErrorState message={parseActivityError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  const fields = [
    { label: 'Realizada em', value: formatCropAreaDate(activity.performedAt) },
    { label: 'Descrição', value: activity.description || 'Não informada' },
    { label: 'Quantidade e unidade', value: formatActivityQuantity(activity.quantity, activity.unit) },
    { label: 'Origem', value: activity.source === 'MANUAL' ? 'Registro manual' : activity.source },
    { label: 'Identificador do autor', value: String(activity.authorId) },
    { label: 'Identificador da atividade', value: String(activity.id) },
    { label: 'Identificador do talhão', value: String(activity.cropAreaId) },
    { label: 'Criada em', value: formatCropAreaDate(activity.createdAt) },
    { label: 'Atualizada em', value: formatCropAreaDate(activity.updatedAt) },
  ];
  return <ScreenContainer>
    <ActivityAccessNotice access={access} />
    {query.isError && <ErrorState title="Não foi possível atualizar a atividade" message={parseActivityError(query.error)} onRetry={() => { void query.refetch(); }} />}
    <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borders.large }}>
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{formatActivityType(activity.type)}</Text>
      {fields.map(field => <View key={field.label} style={{ gap: theme.spacing.xs }}>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{field.label}</Text>
        <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{field.value}</Text>
      </View>)}
    </View>
    {actionError && <ErrorState title="Não foi possível excluir a atividade" message={actionError} />}
    <AppButton title="Editar atividade" variant="secondary" disabled={blocked} onPress={() => navigation.navigate('ActivityEdit', { cropAreaId, id })} />
    <AppButton title={deletion.isPending ? 'Excluindo…' : 'Excluir atividade'} variant="danger" loading={deletion.isPending} disabled={blocked} onPress={confirmDelete} />
  </ScreenContainer>;
}
