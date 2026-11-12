import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { PaginationControls } from '../../components/PaginationControls';
import { ScreenContainer } from '../../components/ScreenContainer';
import { CropAreaCard } from '../../components/cropAreas/CropAreaCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useCropAreas } from '../../hooks/cropAreas/useCropAreas';
import { useCropAreasByFarm } from '../../hooks/cropAreas/useCropAreasByFarm';
import { useTheme } from '../../hooks/useTheme';
import type { CropAreaPage } from '../../types/cropArea';
import type { CropAreasStackParamList } from '../../types/navigation';
import { parseCropAreaError } from '../../utils/cropAreaErrors';

type Props = NativeStackScreenProps<CropAreasStackParamList, 'CropAreaList'>;

function CropAreaList({ navigation, route }: Props) {
  const { theme } = useTheme();
  const farmId = route.params?.farmId;
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<CropAreaPage>();
  const all = useCropAreas(page, 20, farmId === undefined);
  const byFarm = useCropAreasByFarm(farmId, page);
  const query = farmId === undefined ? all : byFarm;
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
    <FlatList data={result?.content ?? []} keyExtractor={area => String(area.id)}
      renderItem={({ item }) => <CropAreaCard area={item} onPress={() => navigation.navigate('CropAreaDetails', { id: item.id, listFarmId: farmId })} />}
      contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
      refreshControl={<RefreshControl refreshing={query.isRefetching}
        onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
        <AppButton title="Cadastrar talhão" onPress={() => navigation.navigate('CropAreaCreate', { farmId })} />
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{farmId === undefined ? 'Todos os talhões' : `Talhões de ${route.params?.farmName ?? 'sua propriedade'}`}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Os talhões arquivados também aparecem nesta lista, identificados pelo status.</Text>
        {query.isError && <ErrorState message={parseCropAreaError(query.error)} onRetry={() => { void query.refetch(); }} />}
        {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.page === page ? 'Atualizando talhões…' : `Carregando página ${page + 1}…`}</Text>}
        {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.page + 1}.</Text>}
      </View>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando talhões…" />
        : !query.isError && !query.isFetching ? <EmptyState title="Nenhum talhão cadastrado" message={farmId === undefined ? 'Cadastre um talhão e vincule-o a uma propriedade.' : 'Cadastre o primeiro talhão desta propriedade.'} /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} resourceLabel="talhões"
        disabled={query.isFetching} onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}

export function CropAreaListScreen(props: Props) {
  return <CropAreaList key={props.route.params?.farmId ?? 'all'} {...props} />;
}
