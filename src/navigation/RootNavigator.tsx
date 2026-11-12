import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useMemo } from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { LoadingState } from '../components/feedback/LoadingState';
import { useAuth } from '../hooks/auth/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SessionRestoreScreen } from '../screens/auth/SessionRestoreScreen';
import { UnsupportedRoleScreen } from '../screens/auth/UnsupportedRoleScreen';
import { AuthStack } from './AuthStack';
import { ProducerStack } from './ProducerStack';

export function RootNavigator() {
  const { user, isLoading, isAuthenticated, hasSessionRestoreError } = useAuth();
  const { theme, isReady } = useTheme();
  const navigationTheme = useMemo(() => ({
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background, card: theme.colors.surface,
      text: theme.colors.text, primary: theme.colors.primary,
      border: theme.colors.border, notification: theme.colors.accent,
    },
  }), [theme]);

  if (isLoading || !isReady) return <ScreenContainer fullSafeArea><LoadingState message="Preparando seu acesso…" /></ScreenContainer>;
  if (hasSessionRestoreError) return <SessionRestoreScreen />;
  if (isAuthenticated && user?.role !== 'PRODUCER') return <UnsupportedRoleScreen />;
  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <ProducerStack key={`producer-${user?.id}`} /> : <AuthStack key="auth" />}
    </NavigationContainer>
  );
}
