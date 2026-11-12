import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/feedback/EmptyState';

export function AlertsScreen() {
  return <ScreenContainer><EmptyState icon="notifications-outline" title="Alertas em breve" message="Os avisos sobre condições de cultivo estão planejados para uma próxima etapa. Este módulo ainda não está disponível." /></ScreenContainer>;
}
