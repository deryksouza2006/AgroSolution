import { Alert } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ErrorState } from '../../components/feedback/ErrorState';
import { BrandMark } from '../../components/navigation/BrandMark';
import { useAuth } from '../../hooks/auth/useAuth';
import { parseApiError } from '../../utils/errors';

export function SessionRestoreScreen() {
  const { retrySessionRestore, signOut } = useAuth();
  return (
    <ScreenContainer fullSafeArea>
      <BrandMark />
      <ErrorState title="Não foi possível validar sua sessão" message="Sua sessão ainda não foi validada. Verifique a conexão e tente novamente ou saia para entrar com outra conta." onRetry={() => { void retrySessionRestore(); }} />
      <AppButton title="Sair" variant="secondary" onPress={() => {
        void signOut().catch((error: unknown) => Alert.alert('Não foi possível sair', parseApiError(error)));
      }} />
    </ScreenContainer>
  );
}
