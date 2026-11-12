import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { PaginationControls } from '../../components/PaginationControls';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SensorCard } from '../../components/sensors/SensorCard';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useSensors } from '../../hooks/sensors/useSensors';
import { useSensorsByCropArea } from '../../hooks/sensors/useSensorsByCropArea';
import { useTheme } from '../../hooks/useTheme';
import type { SensorPage } from '../../types/sensor';
import type { SensorsStackParamList } from '../../types/navigation';
import { parseSensorError } from '../../utils/sensorErrors';

type Props = NativeStackScreenProps<SensorsStackParamList, 'SensorList'>;
function SensorList({ navigation, route }: Props) {
  const { theme } = useTheme();
  const cropAreaId = route.params?.cropAreaId;
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<SensorPage>();
  const all = useSensors(page, 20, cropAreaId === undefined);
  const byCropArea = useSensorsByCropArea(cropAreaId, page);
  const query = cropAreaId === undefined ? all : byCropArea;
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
    <FlatList data={result?.content ?? []} keyExtractor={sensor => String(sensor.id)}
      renderItem={({ item }) => <SensorCard sensor={item} onPress={() => navigation.navigate('SensorDetails', { id: item.id, listCropAreaId: cropAreaId })} />}
      contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg, paddingBottom: theme.spacing.sm }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.lg }}>
        <AppButton title="Cadastrar sensor" onPress={() => navigation.navigate('SensorCreate', { cropAreaId })} />
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{cropAreaId === undefined ? 'Todos os sensores' : `Sensores de ${route.params?.cropAreaName ?? 'seu talhão'}`}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Abra um sensor para consultar seus dados e sua saúde.</Text>
        {query.isError && <ErrorState message={parseSensorError(query.error)} onRetry={() => { void query.refetch(); }} />}
        {query.isFetching && result && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{result.page === page ? 'Atualizando sensores…' : `Carregando página ${page + 1}…`}</Text>}
        {query.isError && result && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados da página {result.page + 1}.</Text>}
      </View>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando sensores…" />
        : !query.isError && !query.isFetching ? <EmptyState title="Nenhum sensor cadastrado" message={cropAreaId === undefined ? 'Cadastre um sensor e vincule-o a um talhão.' : 'Cadastre o primeiro sensor deste talhão.'} icon="hardware-chip-outline" /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} resourceLabel="sensores" disabled={query.isFetching}
        onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}
export function SensorListScreen(props: Props) {
  return <SensorList key={props.route.params?.cropAreaId ?? 'all'} {...props} />;
}
