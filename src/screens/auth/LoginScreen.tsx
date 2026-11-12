import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthForm } from '../../components/AuthForm';
import type { AuthStackParamList } from '../../types/navigation';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  return <AuthForm onSwitch={() => navigation.navigate('Register')} />;
}
