import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/feedback/EmptyState';

export function MonitoringScreen() {
  return <ScreenContainer><EmptyState icon="pulse-outline" title="Monitoramento em breve" message="O acompanhamento de sensores e leituras será desenvolvido nas próximas etapas. Este módulo ainda não está disponível." /></ScreenContainer>;
}
