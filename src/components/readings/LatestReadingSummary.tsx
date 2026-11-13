import { Text, View } from 'react-native';
import { useLatestReading } from '../../hooks/readings/useLatestReading';
import { useTheme } from '../../hooks/useTheme';
import type { Reading } from '../../types/reading';
import { parseReadingError } from '../../utils/readingErrors';
import { AppButton } from '../AppButton';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { LoadingState } from '../feedback/LoadingState';
import { ReadingCard } from './ReadingCard';

export function LatestReadingSummary({ cropAreaId, enabled, onOpen }: { cropAreaId: number; enabled: boolean; onOpen: (reading: Reading) => void }) {
  const { theme } = useTheme();
  const query = useLatestReading(cropAreaId, enabled);
  const reading = query.data;
  return <View style={{ gap: theme.spacing.lg }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Leitura mais recente do talhão</Text>
    {query.isPending && <LoadingState message="Consultando última leitura…" />}
    {query.isError && <ErrorState message={parseReadingError(query.error)} onRetry={() => { if (enabled) void query.refetch(); }} />}
    {query.isError && query.data && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo a última leitura carregada. Tente atualizar novamente.</Text>}
    {reading && <ReadingCard reading={reading} onPress={() => { if (enabled) onOpen(reading); }} />}
    {query.data === null && !query.isError && <EmptyState title="Nenhuma leitura registrada" message="As leituras deste talhão aparecerão aqui após o primeiro registro." icon="reader-outline" />}
    <AppButton title={query.isFetching ? 'Atualizando última leitura…' : 'Atualizar última leitura'} variant="secondary" disabled={!enabled || query.isFetching} onPress={() => { void query.refetch(); }} />
  </View>;
}
