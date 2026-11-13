import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { SensorListScreen } from '../screens/sensors/SensorListScreen';
import { SensorDetailsScreen } from '../screens/sensors/SensorDetailsScreen';
import { SensorFormScreen } from '../screens/sensors/SensorFormScreen';
import { ReadingsStack } from './ReadingsStack';
import type { SensorsStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<SensorsStackParamList>();
export function SensorsStack() {
  const { theme } = useTheme();
  return <Stack.Navigator initialRouteName="SensorList" screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, route, options }) => <AppHeader title={options.title ?? 'Sensores'}
      onBack={route.name !== 'SensorList' || (route.params && 'cropAreaId' in route.params && route.params.cropAreaId !== undefined) ? () => navigation.goBack() : undefined} />,
  }}>
    <Stack.Screen name="SensorList" component={SensorListScreen} options={{ title: 'Sensores' }} />
    <Stack.Screen name="SensorDetails" component={SensorDetailsScreen} options={{ title: 'Detalhes do sensor' }} />
    <Stack.Screen name="SensorCreate" component={SensorFormScreen} options={{ title: 'Cadastrar sensor' }} />
    <Stack.Screen name="SensorEdit" component={SensorFormScreen} options={{ title: 'Editar sensor' }} />
    <Stack.Screen name="Readings" component={ReadingsStack} options={{ headerShown: false }} />
  </Stack.Navigator>;
}
