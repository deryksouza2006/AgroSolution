import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useFarms } from '../../hooks/farms/useFarms';
import { useTheme } from '../../hooks/useTheme';
import type { Farm, FarmPage } from '../../types/farm';
import { parseFarmError } from '../../utils/farmErrors';
import { formatFarmArea } from '../../utils/numberFormatting';
import { AppButton } from '../AppButton';
import { PaginationControls } from '../PaginationControls';
import { ScreenContainer } from '../ScreenContainer';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

type Selection = Pick<Farm, 'id' | 'name'>;
interface Props { value: Selection | null; onChange: (farm: Selection) => void; error?: string; disabled?: boolean }

function FarmOptions({ value, onSelect, onClose }: { value: Selection | null; onSelect: (farm: Farm) => void; onClose: () => void }) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<FarmPage>();
  const query = useFarms(page);
  const result = query.data ?? lastLoaded;
  useEffect(() => {
    if (query.data && !query.isPlaceholderData) {
      setLastLoaded(query.data);
      if (page >= Math.max(1, query.data.totalPages)) setPage(Math.max(0, query.data.totalPages - 1));
    }
  }, [query.data, query.isPlaceholderData, page]);
  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (page === next) void query.refetch();
    else setPage(next);
  };
  return <ScreenContainer fullSafeArea scrollable={false}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Selecionar propriedade</Text>
    <AppButton title="Fechar seleção" variant="secondary" onPress={onClose} />
    <FlatList data={result?.content ?? []} keyExtractor={farm => String(farm.id)}
      contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg }}
      ListHeaderComponent={query.isError ? <ErrorState message={parseFarmError(query.error)} onRetry={() => { void query.refetch(); }} /> : undefined}
      renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: item.id === value?.id }}
        accessibilityLabel={`${item.name}, ${item.city}/${item.state}, ${formatFarmArea(item.totalArea, item.areaUnit)}`}
        onPress={() => onSelect(item)} style={{ minHeight: 48, gap: theme.spacing.sm, padding: theme.spacing.lg,
          borderRadius: theme.borders.radius, borderWidth: item.id === value?.id ? 2 : 1,
          borderColor: item.id === value?.id ? theme.colors.primary : theme.colors.border,
          backgroundColor: item.id === value?.id ? theme.colors.primarySoft : theme.colors.surface }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{item.name}{item.id === value?.id ? ' · Selecionada' : ''}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{item.city}/{item.state}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{formatFarmArea(item.totalArea, item.areaUnit)}</Text>
      </Pressable>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando propriedades…" />
        : !query.isError && !query.isFetching ? <EmptyState title="Nenhuma propriedade cadastrada" message="Cadastre uma propriedade na aba Propriedades antes de criar um talhão." icon="business-outline" /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} disabled={query.isFetching}
        onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}

export function FarmSelector({ value, onChange, error, disabled = false }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return <View style={{ gap: theme.spacing.sm }}>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Propriedade</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{value?.name ?? 'Nenhuma propriedade selecionada'}</Text>
    <AppButton title={value ? 'Alterar propriedade' : 'Selecionar propriedade'} variant="secondary" disabled={disabled} onPress={() => setOpen(true)} />
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>}
    {open && <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)}>
      <FarmOptions value={value} onClose={() => setOpen(false)} onSelect={farm => { onChange({ id: farm.id, name: farm.name }); setOpen(false); }} />
    </Modal>}
  </View>;
}
