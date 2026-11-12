import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AgronomicProfileForm } from '../../components/agronomicProfiles/AgronomicProfileForm';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAgronomicProfile } from '../../hooks/agronomicProfiles/useAgronomicProfile';
import type { CropAreasStackParamList } from '../../types/navigation';
import { parseApiError } from '../../utils/errors';

export function AgronomicProfileFormScreen({ route, navigation }: NativeStackScreenProps<CropAreasStackParamList, 'AgronomicProfileForm'>) {
  const { cropAreaId } = route.params;
  const query = useAgronomicProfile(cropAreaId);
  if (query.isPending) return <ScreenContainer><LoadingState message="Carregando dados do perfil…" /></ScreenContainer>;
  if (query.data === undefined) return <ScreenContainer><ErrorState message={parseApiError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  return <AgronomicProfileForm key={cropAreaId} cropAreaId={cropAreaId} initialProfile={query.data} navigation={navigation}
    loadError={query.isError ? parseApiError(query.error) : undefined} onRetryLoad={() => { void query.refetch(); }} />;
}
