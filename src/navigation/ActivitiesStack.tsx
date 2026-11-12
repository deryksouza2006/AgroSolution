import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { ActivityListScreen } from '../screens/activities/ActivityListScreen';
import { ActivityDetailsScreen } from '../screens/activities/ActivityDetailsScreen';
import { ActivityFormScreen } from '../screens/activities/ActivityFormScreen';
import type { ActivitiesStackParamList, CropAreasStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();
export function ActivitiesStack({ route }: NativeStackScreenProps<CropAreasStackParamList, 'ActivityDiary'>) {
  const { theme } = useTheme();
  return <Stack.Navigator key={route.params.cropAreaId} initialRouteName="ActivityList" screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, options }) => <AppHeader title={options.title ?? 'Diário agrícola'} onBack={() => navigation.goBack()} />,
  }}>
    <Stack.Screen name="ActivityList" component={ActivityListScreen} initialParams={route.params} options={{ title: 'Diário agrícola' }} />
    <Stack.Screen name="ActivityDetails" component={ActivityDetailsScreen} options={{ title: 'Detalhes da atividade' }} />
    <Stack.Screen name="ActivityCreate" component={ActivityFormScreen} options={{ title: 'Cadastrar atividade' }} />
    <Stack.Screen name="ActivityEdit" component={ActivityFormScreen} options={{ title: 'Editar atividade' }} />
  </Stack.Navigator>;
}
