import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { CropAreaListScreen } from '../screens/cropAreas/CropAreaListScreen';
import { CropAreaDetailsScreen } from '../screens/cropAreas/CropAreaDetailsScreen';
import { CropAreaFormScreen } from '../screens/cropAreas/CropAreaFormScreen';
import { ActivitiesStack } from './ActivitiesStack';
import { SensorsStack } from './SensorsStack';
import { ReadingsStack } from './ReadingsStack';
import { RiskJobsStack } from './RiskJobsStack';
import { AlertsStack } from './AlertsStack';
import { AgronomicProfileScreen } from '../screens/agronomicProfiles/AgronomicProfileScreen';
import { AgronomicProfileFormScreen } from '../screens/agronomicProfiles/AgronomicProfileFormScreen';
import type { CropAreasStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<CropAreasStackParamList>();
export function CropAreasStack() {
  const { theme } = useTheme();
  return <Stack.Navigator initialRouteName="CropAreaList" screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, route, options }) => <AppHeader title={options.title ?? 'Talhões'}
      onBack={route.name !== 'CropAreaList' || (route.params && 'farmId' in route.params && route.params.farmId !== undefined) ? () => navigation.goBack() : undefined} />,
  }}>
    <Stack.Screen name="CropAreaList" component={CropAreaListScreen} options={{ title: 'Talhões' }} />
    <Stack.Screen name="CropAreaDetails" component={CropAreaDetailsScreen} options={{ title: 'Detalhes do talhão' }} />
    <Stack.Screen name="CropAreaCreate" component={CropAreaFormScreen} options={{ title: 'Cadastrar talhão' }} />
    <Stack.Screen name="CropAreaEdit" component={CropAreaFormScreen} options={{ title: 'Editar talhão' }} />
    <Stack.Screen name="ActivityDiary" component={ActivitiesStack} options={{ headerShown: false }} />
    <Stack.Screen name="Sensors" component={SensorsStack} options={{ headerShown: false }} />
    <Stack.Screen name="Readings" component={ReadingsStack} options={{ headerShown: false }} />
    <Stack.Screen name="RiskJobs" component={RiskJobsStack} options={{ headerShown: false }} />
    <Stack.Screen name="Alerts" component={AlertsStack} options={{ headerShown: false }} />
    <Stack.Screen name="AgronomicProfile" component={AgronomicProfileScreen} options={{ title: 'Perfil agronômico' }} />
    <Stack.Screen name="AgronomicProfileForm" component={AgronomicProfileFormScreen} options={{ title: 'Dados do perfil agronômico' }} />
  </Stack.Navigator>;
}
