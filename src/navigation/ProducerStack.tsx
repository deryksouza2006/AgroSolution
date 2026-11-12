import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { AboutScreen } from '../screens/settings/AboutScreen';
import { useTheme } from '../hooks/useTheme';
import type { ProducerStackParamList } from '../types/navigation';
import { ProducerTabs } from './ProducerTabs';

const Stack = createNativeStackNavigator<ProducerStackParamList>();
export function ProducerStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark' }}>
      <Stack.Screen name="Tabs" component={ProducerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'Sobre o App', header: ({ navigation }) => <AppHeader title="Sobre o App" onBack={() => navigation.goBack()} /> }} />
    </Stack.Navigator>
  );
}
