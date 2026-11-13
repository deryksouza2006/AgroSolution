import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { PaginationControls } from '../../components/PaginationControls';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ReadingCard } from '../../components/readings/ReadingCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useReadings } from '../../hooks/readings/useReadings';
import { readingKeys } from '../../hooks/readings/readingKeys';
import { useTheme } from '../../hooks/useTheme';
import type { ReadingPage } from '../../types/reading';
import type { ReadingsStackParamList } from '../../types/navigation';
import { parseReadingError } from '../../utils/readingErrors';
import { readingScopeTitle } from '../../utils/readingFormatting';

type Props = NativeStackScreenProps<ReadingsStackParamList, 'ReadingList'>;
function ReadingList({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { scope } = route.params;
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<ReadingPage>();
  const query = useReadings(scope, page);
  const result = query.data ?? lastLoaded;
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    setLastLoaded(query.data);
    const lastPage = Math.max(0, query.data.totalPages - 1);
    if (page > lastPage) setPage(lastPage);
  }, [query.data, query.isPlaceholderData, page]);
  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (page === next) void query.refetch();
    else setPage(next);
  };
  return <ScreenContainer scrollable={false}>
    <FlatList data={result?.content ?? []} keyExtractor={reading => String(reading.id)}
      renderItem={({ item }) => <ReadingCard reading={item} onPress={() => navigation.navigate('ReadingDetails', { id: item.id, scope })} />}
      contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
        <AppButton title="Registrar leitura" onPress={() => navigation.navigate('ReadingCreate', { scope, sensorId: scope.kind === 'sensor' ? scope.sensorId : undefined })} />
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{readingScopeTitle(scope)}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Medições mais recentes primeiro. As leituras registradas são imutáveis. Datas e horários aparecem no fuso deste dispositivo.</Text>
        {query.isError && <ErrorState message={parseReadingError(query.error)} onRetry={() => { void query.refetch(); }} />}
        {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.page === page ? 'Atualizando leituras…' : `Carregando página ${page + 1}…`}</Text>}
        {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.page + 1}.</Text>}
      </View>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando leituras…" />
        : !query.isError && !query.isFetching ? <EmptyState title="Nenhuma leitura registrada" message="Registre uma medição manual em um sensor ativo de um talhão não arquivado." icon="reader-outline" /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} resourceLabel="leituras" disabled={query.isFetching}
        onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}
export function ReadingListScreen(props: Props) {
  return <ReadingList key={readingKeys.scope(props.route.params.scope).join('-')} {...props} />;
}
