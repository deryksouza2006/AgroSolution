import { Alert } from 'react-native';
import { parseApiError } from '../../utils/errors';
import { useAuth } from './useAuth';

export function useConfirmSignOut() {
  const { signOut } = useAuth();
  return () => Alert.alert('Sair da conta?', 'Você precisará entrar novamente para acessar sua conta.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: () => {
      void signOut().catch((error: unknown) => Alert.alert('Não foi possível sair', parseApiError(error)));
    } },
  ]);
}
