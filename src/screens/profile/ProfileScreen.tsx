import { Pressable, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useAuth } from '../../hooks/auth/useAuth';
import { useConfirmSignOut } from '../../hooks/auth/useConfirmSignOut';
import { useTheme } from '../../hooks/useTheme';
import type { ProducerStackParamList, ProducerTabParamList } from '../../types/navigation';
import type { ThemePreference } from '../../theme/tokens';

type Props = CompositeScreenProps<BottomTabScreenProps<ProducerTabParamList, 'Profile'>, NativeStackScreenProps<ProducerStackParamList>>;
const preferences: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'system', label: 'Sistema' },
];

export function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { theme, preference, setPreference, storageError } = useTheme();
  const confirmSignOut = useConfirmSignOut();
  return (
    <ScreenContainer>
      <View style={{ gap: theme.spacing.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.xl, borderRadius: theme.borders.large, ...theme.shadows.card }}>
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Minha conta</Text>
        {[
          { label: 'Nome', value: user?.name }, { label: 'E-mail', value: user?.email },
          { label: 'Papel', value: 'Produtor (PRODUCER)' },
        ].map(item => <View key={item.label} style={{ gap: theme.spacing.xs }}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{item.label}</Text>
          <Text selectable style={[theme.typography.body, { color: theme.colors.text }]}>{item.value}</Text>
        </View>)}
      </View>
      <View style={{ gap: theme.spacing.md }}>
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Aparência</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Escolha um tema ou acompanhe a configuração do dispositivo.</Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Tema do aplicativo" style={{ gap: theme.spacing.sm }}>
          {preferences.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: preference === item.value }} onPress={() => { void setPreference(item.value); }} style={{ minHeight: 48, padding: theme.spacing.md, borderRadius: theme.borders.radius, borderWidth: preference === item.value ? 2 : 1, borderColor: preference === item.value ? theme.colors.primary : theme.colors.border, backgroundColor: preference === item.value ? theme.colors.primarySoft : theme.colors.surface }}>
            <Text style={[theme.typography.label, { color: preference === item.value ? theme.colors.primary : theme.colors.text }]}>{item.label}{preference === item.value ? ' · Selecionado' : ''}</Text>
          </Pressable>)}
        </View>
        {storageError && <ErrorState title="Preferência de tema" message={storageError} />}
      </View>
      <AppButton title="Sobre o App" variant="secondary" onPress={() => navigation.navigate('About')} />
      <AppButton title="Sair da conta" variant="danger" onPress={confirmSignOut} />
    </ScreenContainer>
  );
}
