import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AgronomicProfileSummary } from '../../components/agronomicProfiles/AgronomicProfileSummary';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAgronomicProfile } from '../../hooks/agronomicProfiles/useAgronomicProfile';
import { useTheme } from '../../hooks/useTheme';
import type { CropAreasStackParamList } from '../../types/navigation';
import { parseApiError } from '../../utils/errors';

export function AgronomicProfileScreen({ route, navigation }: NativeStackScreenProps<CropAreasStackParamList, 'AgronomicProfile'>) {
  const { cropAreaId } = route.params;
  const { theme } = useTheme();
  const query = useAgronomicProfile(cropAreaId);
  const refresh = () => { if (!query.isFetching) void query.refetch(); };
  if (query.isPending) return <ScreenContainer><LoadingState message="Carregando perfil agronômico…" /></ScreenContainer>;
  return <ScreenContainer refreshing={query.isRefetching} onRefresh={refresh}>
    {query.isError && <ErrorState title="Não foi possível atualizar o perfil" message={parseApiError(query.error)} onRetry={refresh} />}
    {query.data ? <>
      <AgronomicProfileSummary profile={query.data} />
      {query.isError && <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Exibindo a última revisão carregada. Atualize para confirmar a revisão mais recente.</Text>}
      <AppButton title="Editar perfil / nova revisão" variant="secondary" disabled={query.isFetching}
        onPress={() => navigation.navigate('AgronomicProfileForm', { cropAreaId })} />
    </> : query.data === null ? <>
      <EmptyState title="Perfil agronômico ainda não cadastrado" message="Crie o perfil com os dados do solo e a fonte dessas informações." />
      <AppButton title="Criar perfil" disabled={query.isFetching} onPress={() => navigation.navigate('AgronomicProfileForm', { cropAreaId })} />
    </> : null}
    <AppButton title={query.isRefetching ? 'Atualizando…' : 'Atualizar perfil'} variant="secondary" loading={query.isRefetching} onPress={refresh} />
  </ScreenContainer>;
}
