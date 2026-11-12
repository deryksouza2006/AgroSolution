import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/navigation/AppHeader';
import { useTheme } from '../hooks/useTheme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FarmsScreen } from '../screens/farms/FarmsScreen';
import { MonitoringScreen } from '../screens/monitoring/MonitoringScreen';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import type { ProducerTabParamList } from '../types/navigation';

const Tabs = createBottomTabNavigator<ProducerTabParamList>();
const icons: Record<keyof ProducerTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline', Farms: 'business-outline', Monitoring: 'pulse-outline', Alerts: 'notifications-outline', Profile: 'person-outline',
};
export function ProducerTabs() {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      header: ({ options }) => <AppHeader title={options.title ?? route.name} />,
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarLabelPosition: 'below-icon',
      tabBarAllowFontScaling: true,
      tabBarLabelStyle: { fontSize: 11, textAlign: 'center' },
      tabBarItemStyle: { paddingVertical: theme.spacing.xs },
      tabBarStyle: { height: Math.max(76, 48 + 28 * fontScale) + insets.bottom, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} accessible={false} />,
      sceneStyle: { backgroundColor: theme.colors.background },
    })}>
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tabs.Screen name="Farms" component={FarmsScreen} options={{ title: 'Propriedades' }} />
      <Tabs.Screen name="Monitoring" component={MonitoringScreen} options={{ title: 'Monitoramento' }} />
      <Tabs.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alertas' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tabs.Navigator>
  );
}
