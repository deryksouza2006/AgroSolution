import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, Text, View } from 'react-native';
import { useCropAreasByFarm } from '../../hooks/cropAreas/useCropAreasByFarm';
import { useTheme } from '../../hooks/useTheme';
import type { CropArea, CropAreaPage } from '../../types/cropArea';
import { parseCropAreaError } from '../../utils/cropAreaErrors';
import { formatCropAreaStatus } from '../../utils/cropAreaFormatting';
import { AppButton } from '../AppButton';
import { PaginationControls } from '../PaginationControls';
import { ScreenContainer } from '../ScreenContainer';
import { FarmSelector } from '../farms/FarmSelector';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

export type CropAreaSensorSelection = Pick<CropArea, 'id' | 'name' | 'farmId' | 'farmName'>;
type FarmSelection = { id: number; name: string };
function CropAreaOptions({ farm, value, onSelect, onClose }: {
  farm: FarmSelection; value: CropAreaSensorSelection | null; onSelect: (area: CropArea) => void; onClose: () => void;
}) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<CropAreaPage>();
  const query = useCropAreasByFarm(farm.id, page);
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
  return <ScreenContainer fullSafeArea scrollable={false}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Talhões de {farm.name}</Text>
    <AppButton title="Fechar seleção" variant="secondary" onPress={onClose} />
    <FlatList data={result?.content ?? []} keyExtractor={area => String(area.id)} contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={query.isError ? <ErrorState message={parseCropAreaError(query.error)} onRetry={() => { void query.refetch(); }} /> : undefined}
      renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: item.id === value?.id }}
        accessibilityLabel={`${item.name}, ${item.cropType}, ${formatCropAreaStatus(item.status)}`}
        onPress={() => onSelect(item)} style={{ minHeight: 48, gap: theme.spacing.sm, padding: theme.spacing.lg,
          borderRadius: theme.borders.radius, borderWidth: item.id === value?.id ? 2 : 1,
          borderColor: item.id === value?.id ? theme.colors.primary : theme.colors.border,
          backgroundColor: item.id === value?.id ? theme.colors.primarySoft : theme.colors.surface }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{item.name}{item.id === value?.id ? ' · Selecionado' : ''}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{item.cropType} · {formatCropAreaStatus(item.status)}</Text>
      </Pressable>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando talhões…" />
        : !query.isError && !query.isFetching ? <EmptyState title="Nenhum talhão cadastrado" message="Cadastre um talhão nesta propriedade ou selecione outra propriedade." /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} resourceLabel="talhões" disabled={query.isFetching}
        onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}

export function CropAreaSelector({ value, onChange, error, disabled = false }: {
  value: CropAreaSensorSelection | null; onChange: (value: CropAreaSensorSelection | null) => void; error?: string; disabled?: boolean;
}) {
  const { theme } = useTheme();
  const [farm, setFarm] = useState<FarmSelection | null>(() => value ? { id: value.farmId, name: value.farmName } : null);
  const [open, setOpen] = useState(false);
  return <View style={{ gap: theme.spacing.lg }}>
    <FarmSelector value={farm} disabled={disabled} onChange={next => {
      if (next.id !== farm?.id) onChange(null);
      setFarm(next);
    }} />
    <View style={{ gap: theme.spacing.sm }}>
      <Text style={[theme.typography.label, { color: theme.colors.text }]}>Talhão de destino</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{value?.name ?? 'Nenhum talhão selecionado'}</Text>
      <AppButton title={value ? 'Alterar talhão' : 'Selecionar talhão'} variant="secondary" disabled={disabled || !farm} onPress={() => setOpen(true)} />
      {!farm && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Selecione primeiro uma propriedade.</Text>}
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>}
    </View>
    {open && farm && <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)}>
      <CropAreaOptions key={farm.id} farm={farm} value={value} onClose={() => setOpen(false)} onSelect={area => {
        onChange({ id: area.id, name: area.name, farmId: area.farmId, farmName: area.farmName }); setOpen(false);
      }} />
    </Modal>}
  </View>;
}
