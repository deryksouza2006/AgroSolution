import { useMemo, type ReactElement } from 'react';
import { RefreshControl, SectionList, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { Dashboard } from '../../types/dashboard';
import { dashboardCropName } from '../../utils/dashboardFormatting';
import { dashboardSections, type DashboardEntry, type DashboardSection } from '../../utils/dashboardSections';
import { EmptyState } from '../feedback/EmptyState';
import { DashboardActivityCard } from './DashboardActivityCard';
import { DashboardCropCard } from './DashboardCropCard';
import { DashboardJobCard } from './DashboardJobCard';
import { DashboardReadingCard } from './DashboardReadingCard';
import { DashboardSensorCard } from './DashboardSensorCard';

interface Props {
  dashboard?: Dashboard;
  header: ReactElement;
  refreshing: boolean;
  onRefresh: () => void;
  onCrop: (id: number) => void;
  onSensor: (id: number) => void;
  onReading: (id: number) => void;
  onDiary: (cropAreaId: number, name: string) => void;
}
export function DashboardFeed({ dashboard, header, refreshing, onRefresh, onCrop, onSensor, onReading, onDiary }: Props) {
  const { theme } = useTheme();
  const sections = useMemo(() => dashboard ? dashboardSections(dashboard) : [], [dashboard]);
  const cropAction = (id: number | null) => id === null ? undefined : () => onCrop(id);
  const renderEntry = (entry: DashboardEntry) => {
    if (!dashboard) return null;
    switch (entry.kind) {
      case 'crop': return <DashboardCropCard summary={entry.value} name={dashboardCropName(dashboard, entry.value.cropAreaId)} onPress={cropAction(entry.value.cropAreaId)} />;
      case 'alert': case 'job': return <DashboardJobCard job={entry.value} cropName={dashboardCropName(dashboard, entry.value.cropAreaId)} alert={entry.kind === 'alert'} onPress={cropAction(entry.value.cropAreaId)} />;
      case 'sensor': {
        const sensor = entry.value;
        const id = sensor.id;
        return <DashboardSensorCard sensor={sensor} cropName={dashboardCropName(dashboard, sensor.cropAreaId)} onPress={id === null ? undefined : () => onSensor(id)} />;
      }
      case 'activity': {
        const activity = entry.value;
        const id = activity.cropAreaId;
        const name = dashboardCropName(dashboard, id);
        return <DashboardActivityCard activity={activity} cropName={name} onPress={id === null ? undefined : () => onDiary(id, name)} />;
      }
      case 'reading': {
        const reading = entry.value;
        const id = reading.id;
        return <DashboardReadingCard reading={reading} onPress={id === null ? undefined : () => onReading(id)} />;
      }
    }
  };
  return <SectionList<DashboardEntry, DashboardSection> sections={sections} keyExtractor={entry => entry.key}
    renderItem={({ item }) => <View style={{ marginBottom: theme.spacing.lg }}>{renderEntry(item)}</View>}
    renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text, paddingVertical: theme.spacing.lg }]}>{section.title}</Text>}
    stickySectionHeadersEnabled={false} ListHeaderComponent={header}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: theme.spacing.lg }}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}
    ListEmptyComponent={dashboard ? <EmptyState title={dashboard.partial ? 'Algumas informações ainda não estão disponíveis' : 'Seu acompanhamento começa aqui'}
      message={dashboard.partial ? 'Atualize o dashboard para tentar carregar as informações restantes.' : 'Cadastre propriedades e talhões ou registre medições para acompanhar sua produção. As informações disponíveis aparecerão aqui.'} /> : undefined} />;
}
