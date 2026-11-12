import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { PaginationControls } from '../../components/PaginationControls';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ActivityAccessNotice } from '../../components/activities/ActivityAccessNotice';
import { ActivityCard } from '../../components/activities/ActivityCard';
import { ActivityFilters } from '../../components/activities/ActivityFilters';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useActivities } from '../../hooks/activities/useActivities';
import { useActivityAccess } from '../../hooks/activities/useActivityAccess';
import { useTheme } from '../../hooks/useTheme';
import type { ActivityFilters as Filters, ActivityFilterValues, ActivityPage } from '../../types/activity';
import type { ActivitiesStackParamList } from '../../types/navigation';
import { parseActivityError } from '../../utils/activityErrors';
import { formatActivityType } from '../../utils/activityFormatting';

type Props = NativeStackScreenProps<ActivitiesStackParamList, 'ActivityList'>;
function ActivityList({ route, navigation, filters, filterValues, onApply }: Props & {
  filters: Filters; filterValues: ActivityFilterValues; onApply: (filters: Filters, values: ActivityFilterValues) => void;
}) {
  const { theme } = useTheme();
  const { cropAreaId } = route.params;
  const access = useActivityAccess(cropAreaId);
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<ActivityPage>();
  const query = useActivities(cropAreaId, page, filters);
  const result = query.data ?? lastLoaded;
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    setLastLoaded(query.data);
    const lastPage = Math.max(0, query.data.totalPages - 1);
    if (page > lastPage) setPage(lastPage);
  }, [query.data, query.isPlaceholderData, page]);
  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (next === page) void query.refetch();
    else setPage(next);
  };
  const filtered = Boolean(filters.type || filters.from || filters.to);
  return <ScreenContainer scrollable={false}>
    <FlatList data={result?.content ?? []} keyExtractor={activity => String(activity.id)}
      renderItem={({ item }) => <ActivityCard activity={item} onPress={() => navigation.navigate('ActivityDetails', { cropAreaId, id: item.id })} />}
      contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
      refreshControl={<RefreshControl refreshing={query.isRefetching || access.query.isRefetching}
        onRefresh={() => { if (!query.isFetching && !access.query.isFetching) void Promise.allSettled([query.refetch(), access.query.refetch()]); }}
        tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{access.query.data?.name ?? route.params.cropAreaName}</Text>
        <ActivityAccessNotice access={access} />
        <AppButton title="Cadastrar atividade" disabled={!access.canWrite} onPress={() => navigation.navigate('ActivityCreate', { cropAreaId })} />
        <ActivityFilters initialValues={filterValues} onApply={onApply} />
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Atividades mais recentes primeiro. Datas no fuso do dispositivo.</Text>
        {filtered && <Text style={[theme.typography.body, { color: theme.colors.text }]}>Filtros: {filterValues.type ? formatActivityType(filterValues.type) : 'Todos os tipos'} · De {filterValues.fromDate || 'qualquer data'} até {filterValues.toDate || 'qualquer data'}.</Text>}
        {query.isError && <ErrorState message={parseActivityError(query.error)} onRetry={() => { void query.refetch(); }} />}
        {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.number === page ? 'Atualizando atividades…' : `Carregando página ${page + 1}…`}</Text>}
        {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.number + 1}.</Text>}
      </View>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando diário agrícola…" />
        : !query.isError && !query.isFetching ? <EmptyState title={filtered ? 'Nenhuma atividade para estes filtros' : 'Diário sem atividades'}
          message={filtered ? 'Altere ou limpe os filtros para consultar outro período ou tipo.' : access.archived ? 'Este talhão não possui atividades registradas.' : 'Cadastre a primeira atividade realizada neste talhão.'} icon="journal-outline" /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.number} totalPages={result.totalPages} resourceLabel="atividades"
        disabled={query.isFetching} onPrevious={() => changePage(result.number - 1)} onNext={() => changePage(result.number + 1)} /> : undefined} />
  </ScreenContainer>;
}

export function ActivityListScreen(props: Props) {
  const [selection, setSelection] = useState<{ filters: Filters; values: ActivityFilterValues; revision: number }>({
    filters: {}, values: { type: '', fromDate: '', toDate: '' }, revision: 0,
  });
  return <ActivityList key={`${props.route.params.cropAreaId}-${selection.revision}`} {...props}
    filters={selection.filters} filterValues={selection.values} onApply={(filters, values) => {
      setSelection(previous => ({ filters, values, revision: previous.revision + 1 }));
    }} />;
}
