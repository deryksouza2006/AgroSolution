import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RiskJobPagedList } from '../../components/riskJobs/RiskJobPagedList';
import { useRiskJobs } from '../../hooks/riskJobs/useRiskJobs';
import type { RiskJobsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RiskJobsStackParamList, 'RiskJobList'>;
function RiskJobList({ route, navigation }: Props) {
  const [page, setPage] = useState(0);
  const query = useRiskJobs(route.params.cropAreaId, page);
  return <RiskJobPagedList query={query} page={page} onPage={setPage} title={`Histórico de ${route.params.cropAreaName ?? `talhão #${route.params.cropAreaId}`}`}
    onOpen={jobId => navigation.navigate('RiskJobDetails', { jobId, cropAreaId: route.params.cropAreaId })} />;
}
export function RiskJobListScreen(props: Props) { return <RiskJobList key={props.route.params.cropAreaId} {...props} />; }
