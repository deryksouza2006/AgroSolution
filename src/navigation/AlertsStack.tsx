import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';
import { AlertDetailsScreen } from '../screens/alerts/AlertDetailsScreen';
import type { AlertsStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AlertsStackParamList>();
export function AlertsStack() {
  const { theme } = useTheme();
  return <Stack.Navigator initialRouteName="AlertList" screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, route, options }) => <AppHeader title={options.title ?? 'Alertas'}
      onBack={route.name !== 'AlertList' || (route.params && 'cropAreaId' in route.params && route.params.cropAreaId !== undefined) || navigation.getParent()?.getState().type === 'stack' ? () => navigation.goBack() : undefined} />,
  }}>
    <Stack.Screen name="AlertList" component={AlertsScreen} options={{ title: 'Alertas' }} />
    <Stack.Screen name="AlertDetails" component={AlertDetailsScreen} options={{ title: 'Detalhes do alerta' }} />
  </Stack.Navigator>;
}
