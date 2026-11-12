import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useTheme } from './src/hooks/useTheme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';

function AppContent() {
  const { theme } = useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider><AppContent /></ThemeProvider>
    </SafeAreaProvider>
  );
}
