import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { FarmListScreen } from '../screens/farms/FarmListScreen';
import { FarmDetailsScreen } from '../screens/farms/FarmDetailsScreen';
import { FarmFormScreen } from '../screens/farms/FarmFormScreen';
import type { FarmsStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<FarmsStackParamList>();

export function FarmsStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator initialRouteName="FarmList" screenOptions={{
      contentStyle: { backgroundColor: theme.colors.background },
      statusBarStyle: theme.isDark ? 'light' : 'dark',
      header: ({ navigation, route, options }) => <AppHeader title={options.title ?? 'Propriedades'} onBack={route.name === 'FarmList' ? undefined : () => navigation.goBack()} />,
    }}>
      <Stack.Screen name="FarmList" component={FarmListScreen} options={{ title: 'Propriedades' }} />
      <Stack.Screen name="FarmDetails" component={FarmDetailsScreen} options={{ title: 'Detalhes da propriedade' }} />
      <Stack.Screen name="FarmCreate" component={FarmFormScreen} options={{ title: 'Cadastrar propriedade' }} />
      <Stack.Screen name="FarmEdit" component={FarmFormScreen} options={{ title: 'Editar propriedade' }} />
    </Stack.Navigator>
  );
}
