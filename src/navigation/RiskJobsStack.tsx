import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { RiskJobListScreen } from '../screens/riskJobs/RiskJobListScreen';
import { RiskJobDetailsScreen } from '../screens/riskJobs/RiskJobDetailsScreen';
import type { RiskJobsEntryParams, RiskJobsStackParamList } from '../types/navigation';
import { AlertsStack } from './AlertsStack';

const Stack = createNativeStackNavigator<RiskJobsStackParamList>();
export function RiskJobsStack({ route }: { route: { params: RiskJobsEntryParams } }) {
  const { theme } = useTheme();
  const { cropAreaId, cropAreaName, jobId } = route.params;
  return <Stack.Navigator key={JSON.stringify(route.params)} initialRouteName={jobId !== undefined ? 'RiskJobDetails' : 'RiskJobList'} screenOptions={{
    contentStyle: { backgroundColor: theme.colors.background }, statusBarStyle: theme.isDark ? 'light' : 'dark',
    header: ({ navigation, options }) => <AppHeader title={options.title ?? 'Análises'} onBack={() => navigation.goBack()} />,
  }}>
    <Stack.Screen name="RiskJobList" component={RiskJobListScreen} initialParams={cropAreaId !== undefined ? { cropAreaId, cropAreaName } : undefined} options={{ title: 'Histórico de análises' }} />
    <Stack.Screen name="RiskJobDetails" component={RiskJobDetailsScreen} initialParams={jobId !== undefined ? { jobId, cropAreaId } : undefined} options={{ title: 'Risco hídrico' }} />
    <Stack.Screen name="Alerts" component={AlertsStack} options={{ headerShown: false }} />
  </Stack.Navigator>;
}
