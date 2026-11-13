import { Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { DashboardDataNotice } from '../../components/dashboard/DashboardBadges';
import { DashboardFeed } from '../../components/dashboard/DashboardFeed';
import { DashboardSummaryCards } from '../../components/dashboard/DashboardSummaryCards';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { BrandMark } from '../../components/navigation/BrandMark';
import { useAuth } from '../../hooks/auth/useAuth';
import { useDashboard } from '../../hooks/dashboard/useDashboard';
import { useTheme } from '../../hooks/useTheme';
import type { ProducerTabParamList } from '../../types/navigation';
import { formatDashboardDate } from '../../utils/dashboardFormatting';
import { dashboardId } from '../../utils/dashboardNormalization';
import { parseApiError } from '../../utils/errors';

export function HomeScreen({ navigation }: BottomTabScreenProps<ProducerTabParamList, 'Home'>) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const focused = useIsFocused();
  const query = useDashboard(focused);
  const dashboard = query.data;
  const refresh = () => { if (focused && !query.isFetching) void query.refetch(); };
  const header = <View style={{ gap: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
      <BrandMark />
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Olá, {user?.name?.trim() || 'produtor'}.</Text>
      {dashboard && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Última atualização: {formatDashboardDate(dashboard.updatedAt)}</Text>}
      {query.isPending && <LoadingState message="Carregando dashboard…" />}
      {query.isError && <ErrorState title="Não foi possível atualizar o dashboard" message={parseApiError(query.error)} onRetry={refresh} />}
      {query.isError && dashboard && <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Exibindo os últimos dados carregados. Atualize para tentar novamente.</Text>}
      {query.isFetching && dashboard && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Atualizando dashboard…</Text>}
      <AppButton title={query.isFetching ? 'Atualizando dashboard…' : 'Atualizar dashboard'} variant="secondary" disabled={query.isFetching} onPress={refresh} />
      {dashboard && <>
        <DashboardDataNotice data={dashboard} />
        {dashboard.partial && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Algumas informações não foram fornecidas ou estão indisponíveis. Os dados válidos continuam sendo exibidos.</Text>}
        <DashboardSummaryCards dashboard={dashboard} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>As seções exibem até 20 itens por tipo. Riscos e indicadores são calculados pelo servidor e não substituem avaliação profissional.</Text>
      </>}
    </View>;
  return <ScreenContainer scrollable={false}>
    <DashboardFeed dashboard={dashboard} header={header} refreshing={query.isRefetching} onRefresh={refresh}
      onCrop={id => { if (dashboardId(id)) navigation.navigate('Monitoring', { screen: 'CropAreaDetails', params: { id }, initial: false }); }}
      onSensor={id => { if (dashboardId(id)) navigation.navigate('Sensors', { screen: 'SensorDetails', params: { id }, initial: false }); }}
      onReading={id => { if (dashboardId(id)) navigation.navigate('Sensors', { screen: 'Readings', params: { scope: { kind: 'all' }, readingId: id }, initial: false }); }}
      onDiary={(cropAreaId, name) => { if (dashboardId(cropAreaId)) navigation.navigate('Monitoring', { screen: 'ActivityDiary', params: { cropAreaId, cropAreaName: name }, initial: false }); }} />
  </ScreenContainer>;
}
