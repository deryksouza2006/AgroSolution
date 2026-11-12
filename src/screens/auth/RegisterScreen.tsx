import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthForm } from '../../components/AuthForm';
import type { AuthStackParamList } from '../../types/navigation';

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Register'>) {
  return <AuthForm registering onSwitch={() => navigation.goBack()} />;
}
