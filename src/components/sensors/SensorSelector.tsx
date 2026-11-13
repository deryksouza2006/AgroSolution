import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSensors } from '../../hooks/sensors/useSensors';
import { useSensorsByCropArea } from '../../hooks/sensors/useSensorsByCropArea';
import { useTheme } from '../../hooks/useTheme';
import type { Sensor, SensorPage } from '../../types/sensor';
import { parseSensorError } from '../../utils/sensorErrors';
import { formatSensorStatus, formatSensorType } from '../../utils/sensorFormatting';
import { AppButton } from '../AppButton';
import { PaginationControls } from '../PaginationControls';
import { ScreenContainer } from '../ScreenContainer';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';

function SensorOptions({ value, cropAreaId, onSelect, onClose }: {
  value: Sensor | null; cropAreaId?: number; onSelect: (sensor: Sensor) => void; onClose: () => void;
}) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const [lastLoaded, setLastLoaded] = useState<SensorPage>();
  const all = useSensors(page, 20, cropAreaId === undefined);
  const byCropArea = useSensorsByCropArea(cropAreaId, page);
  const query = cropAreaId === undefined ? all : byCropArea;
  const result = query.data ?? lastLoaded;
  useEffect(() => {
    if (!query.data || query.isPlaceholderData) return;
    setLastLoaded(query.data);
    if (page > Math.max(0, query.data.totalPages - 1)) setPage(Math.max(0, query.data.totalPages - 1));
  }, [query.data, query.isPlaceholderData, page]);
  const changePage = (next: number) => {
    if (query.isFetching) return;
    if (page === next) void query.refetch();
    else setPage(next);
  };
  return <ScreenContainer fullSafeArea scrollable={false}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Selecionar sensor ativo</Text>
    <AppButton title="Fechar seleção" variant="secondary" onPress={onClose} />
    <FlatList data={result?.content ?? []} keyExtractor={sensor => String(sensor.id)} contentContainerStyle={{ flexGrow: 1, gap: theme.spacing.lg }}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => { if (!query.isFetching) void query.refetch(); }} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
      ListHeaderComponent={<View style={{ gap: theme.spacing.md }}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Somente sensores ativos podem ser selecionados. O talhão também será verificado antes do registro.</Text>
        {query.isError && <ErrorState message={parseSensorError(query.error)} onRetry={() => { void query.refetch(); }} />}
      </View>}
      renderItem={({ item }) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: item.id === value?.id, disabled: item.status !== 'ACTIVE' }}
        accessibilityLabel={`${item.name}, ${formatSensorType(item.sensorType)}, ${item.cropAreaName}, ${item.farmName}, ${formatSensorStatus(item.status)}`}
        disabled={item.status !== 'ACTIVE'} onPress={() => onSelect(item)} style={{ minHeight: 48, gap: theme.spacing.sm, padding: theme.spacing.lg,
          borderRadius: theme.borders.radius, borderWidth: item.id === value?.id ? 2 : 1,
          borderColor: item.id === value?.id ? theme.colors.primary : theme.colors.border,
          backgroundColor: item.id === value?.id ? theme.colors.primarySoft : theme.colors.surface, opacity: item.status === 'ACTIVE' ? 1 : 0.55 }}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>{item.name}{item.id === value?.id ? ' · Selecionado' : ''}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{item.cropAreaName} · {item.farmName}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.text }]}>{formatSensorType(item.sensorType)} · {formatSensorStatus(item.status)}</Text>
        {item.status !== 'ACTIVE' && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Indisponível para registrar leituras</Text>}
      </Pressable>}
      ListEmptyComponent={query.isPending && !result ? <LoadingState message="Carregando sensores…" /> : !query.isError && !query.isFetching
        ? <EmptyState title="Nenhum sensor cadastrado" message="Cadastre um sensor na aba Sensores para registrar leituras." icon="hardware-chip-outline" /> : undefined}
      ListFooterComponent={result ? <PaginationControls page={result.page} totalPages={result.totalPages} resourceLabel="sensores" disabled={query.isFetching}
        onPrevious={() => changePage(result.page - 1)} onNext={() => changePage(result.page + 1)} /> : undefined} />
  </ScreenContainer>;
}
export function SensorSelector({ value, cropAreaId, onChange, error, disabled = false }: {
  value: Sensor | null; cropAreaId?: number; onChange: (sensor: Sensor) => void; error?: string; disabled?: boolean;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  return <View style={{ gap: theme.spacing.sm }}>
    <Text style={[theme.typography.label, { color: theme.colors.text }]}>Sensor</Text>
    <Text style={[theme.typography.body, { color: theme.colors.text }]}>{value ? `${value.name} · ${formatSensorType(value.sensorType)}` : 'Nenhum sensor selecionado'}</Text>
    {value && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{value.cropAreaName} · {value.farmName}</Text>}
    <AppButton title={value ? 'Alterar sensor' : 'Selecionar sensor'} variant="secondary" disabled={disabled} onPress={() => setOpen(true)} />
    {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[theme.typography.caption, { color: theme.colors.danger }]}>{error}</Text>}
    {open && <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)}>
      <SensorOptions key={cropAreaId ?? 'all'} value={value} cropAreaId={cropAreaId} onClose={() => setOpen(false)} onSelect={sensor => { onChange(sensor); setOpen(false); }} />
    </Modal>}
  </View>;
}
