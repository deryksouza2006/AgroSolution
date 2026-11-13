import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RiskJobPagedList } from '../../components/riskJobs/RiskJobPagedList';
import { useAlerts } from '../../hooks/alerts/useAlerts';
import type { AlertsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AlertsStackParamList, 'AlertList'>;
function AlertList({ route, navigation }: Props) {
  const [page, setPage] = useState(0);
  const cropAreaId = route.params?.cropAreaId;
  const query = useAlerts(cropAreaId, page);
  return <RiskJobPagedList query={query} page={page} onPage={setPage} alert
    title={cropAreaId === undefined ? 'Todos os alertas disponíveis' : `Alertas de ${route.params?.cropAreaName ?? `talhão #${cropAreaId}`}`}
    onOpen={jobId => navigation.navigate('AlertDetails', { jobId })} />;
}
export function AlertsScreen(props: Props) { return <AlertList key={props.route.params?.cropAreaId ?? 'all'} {...props} />; }
