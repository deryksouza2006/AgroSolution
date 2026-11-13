import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { ReadingListScreen } from '../screens/readings/ReadingListScreen';
import { ReadingDetailsScreen } from '../screens/readings/ReadingDetailsScreen';
import { ReadingFormScreen } from '../screens/readings/ReadingFormScreen';
import type { ReadingsEntryParams, ReadingsStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ReadingsStackParamList>();
export function ReadingsStack({ route }: { route: { params: ReadingsEntryParams } }) {
  const { theme } = useTheme();
  const { scope, registerSensorId, readingId } = route.params;
  return <Stack.Navigator key={JSON.stringify(route.params)} initialRouteName={readingId !== undefined ? 'ReadingDetails' : registerSensorId !== undefined ? 'ReadingCreate' : 'ReadingList'} screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, options }) => <AppHeader title={options.title ?? 'Leituras'} onBack={() => navigation.goBack()} />,
  }}>
    <Stack.Screen name="ReadingList" component={ReadingListScreen} initialParams={{ scope }} options={{ title: 'Leituras' }} />
    <Stack.Screen name="ReadingDetails" component={ReadingDetailsScreen} initialParams={readingId !== undefined ? { id: readingId, scope } : undefined} options={{ title: 'Detalhes da leitura' }} />
    <Stack.Screen name="ReadingCreate" component={ReadingFormScreen} initialParams={{ scope, sensorId: registerSensorId ?? (scope.kind === 'sensor' ? scope.sensorId : undefined) }} options={{ title: 'Registrar leitura' }} />
  </Stack.Navigator>;
}
