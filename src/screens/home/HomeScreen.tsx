import { Text } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/feedback/EmptyState';
import { BrandMark } from '../../components/navigation/BrandMark';
import { useAuth } from '../../hooks/auth/useAuth';
import { useTheme } from '../../hooks/useTheme';

export function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  return (
    <ScreenContainer>
      <BrandMark />
      <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Olá, {user?.name}.</Text>
      <EmptyState title="Sua conta está pronta" message="Esta primeira etapa reúne acesso seguro, perfil e preferências. Os recursos de acompanhamento agrícola serão disponibilizados nas próximas etapas." />
    </ScreenContainer>
  );
}
