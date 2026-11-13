import { useEffect, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJobPage } from '../../types/riskJob';
import { parseRiskJobError } from '../../utils/riskJobErrors';
import { PaginationControls } from '../PaginationControls';
import { ScreenContainer } from '../ScreenContainer';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { RiskJobCard } from './RiskJobCard';

export function RiskJobPagedList({ query, page, onPage, title, alert = false, onOpen, header }: {
  query: UseQueryResult<RiskJobPage, Error>; page: number; onPage: (page: number) => void; title: string;
  alert?: boolean; onOpen: (jobId: number) => void; header?: ReactNode;
}) {
  const { theme } = useTheme();
  const [lastLoaded, setLastLoaded] = useState<RiskJobPage>();
  const result = query.data ?? lastLoaded;
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    setLastLoaded(query.data);
    const lastPage = Math.max(0, query.data.totalPages - 1);
    if (!query.data.partial && page > lastPage) onPage(lastPage);
  }, [query.data, query.isPlaceholderData, page, onPage]);
  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (page === next) void query.refetch(); else onPage(next);
  };
  return <ScreenContainer scrollable={false}>
    <FlatList data={result?.content ?? []} keyExtractor={(job, index) => `${job.id}-${index}`} contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg }}
      renderItem={({ item }) => { const id = item.id; return <RiskJobCard job={item} alert={alert} onPress={id === null ? undefined : () => onOpen(id)} />; }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
        {header}
        {query.isError && <ErrorState message={parseRiskJobError(query.error)} onRetry={() => { void query.refetch(); }} />}
        {result?.partial && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Alguns dados desta página não foram disponibilizados pelo servidor.</Text>}
        {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.number === page ? 'Atualizando…' : `Carregando página ${page + 1}…`}</Text>}
        {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.number + 1}.</Text>}
      </View>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message={alert ? 'Carregando alertas…' : 'Carregando análises…'} /> : !query.isError && !query.isFetching
        ? <EmptyState icon={alert ? 'notifications-outline' : 'water-outline'} title={alert ? 'Nenhum alerta disponível' : 'Nenhuma análise disponível'} message={alert ? 'Os alertas informados pelo servidor aparecerão aqui.' : 'Solicite uma análise nos detalhes do talhão para iniciar o histórico.'} /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.number} totalPages={result.totalPages} resourceLabel={alert ? 'alertas' : 'análises'} disabled={query.isFetching}
        onPrevious={() => changePage(result.number - 1)} onNext={() => changePage(result.number + 1)} /> : undefined} />
  </ScreenContainer>;
}
