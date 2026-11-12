import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/feedback/EmptyState';

export function FarmsScreen() {
  return <ScreenContainer><EmptyState icon="business-outline" title="Propriedades em breve" message="O cadastro e a organização de propriedades e talhões estão planejados para uma próxima etapa. Este módulo ainda não está disponível." /></ScreenContainer>;
}
