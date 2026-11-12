import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { PaginationControls } from '../../components/PaginationControls';
import { ScreenContainer } from '../../components/ScreenContainer';
import { FarmCard } from '../../components/farms/FarmCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useFarms } from '../../hooks/farms/useFarms';
import { useTheme } from '../../hooks/useTheme';
import type { FarmPage } from '../../types/farm';
import type { FarmsStackParamList } from '../../types/navigation';
import { parseFarmError } from '../../utils/farmErrors';

export function FarmListScreen({ navigation }: NativeStackScreenProps<FarmsStackParamList, 'FarmList'>) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<FarmPage | undefined>();
  const query = useFarms(page);
  const result = query.data ?? lastLoaded;

  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    setLastLoaded(query.data);
    // Deletion may remove the last item of the last page.
    const lastPage = Math.max(0, query.data.totalPages - 1);
    if (page > lastPage) setPage(lastPage);
  }, [query.data, query.isPlaceholderData, page]);

  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (next === page) void query.refetch();
    else setPage(next);
  };

  return (
    <ScreenContainer scrollable={false}>
      <FlatList
        data={result?.content ?? []}
        keyExtractor={farm => String(farm.id)}
        renderItem={({ item }) => <FarmCard farm={item} onPress={() => navigation.navigate('FarmDetails', { id: item.id })} />}
        contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
        refreshControl={<RefreshControl refreshing={query.isRefetching}
          onRefresh={() => { if (!query.isFetching) void query.refetch(); }}
          tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
        ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
          <AppButton title="Cadastrar propriedade" onPress={() => navigation.navigate('FarmCreate')} />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Consulte e organize suas propriedades rurais.</Text>
          {query.isError && <ErrorState title="Não foi possível carregar as propriedades" message={parseFarmError(query.error)} onRetry={() => { void query.refetch(); }} />}
          {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.page !== page ? `Carregando página ${page + 1}…` : 'Atualizando propriedades…'}</Text>}
          {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.page + 1}.</Text>}
        </View>}
        ListEmptyComponent={query.isPending && !result
          ? <LoadingState message="Carregando propriedades…" />
          : !query.isError && !query.isFetching
            ? <EmptyState icon="business-outline" title="Nenhuma propriedade cadastrada" message="Cadastre sua primeira propriedade para começar." />
            : undefined}
        ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages}
          disabled={query.isFetching} onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined}
      />
    </ScreenContainer>
  );
}
