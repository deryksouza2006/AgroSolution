import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useAuth } from '../../hooks/auth/useAuth';
import { useConfirmSignOut } from '../../hooks/auth/useConfirmSignOut';

export function UnsupportedRoleScreen() {
  const { user } = useAuth();
  const confirmSignOut = useConfirmSignOut();
  return (
    <ScreenContainer fullSafeArea>
      <EmptyState icon="person-circle-outline" title="Interface ainda indisponível" message={`Sua conta foi validada, mas o perfil ${user?.role === 'TECHNICIAN' ? 'técnico' : 'administrador'} ainda não possui interface mobile. O acesso nesta etapa está disponível para produtores.`} />
      <AppButton title="Sair da conta" variant="secondary" onPress={confirmSignOut} />
    </ScreenContainer>
  );
}
