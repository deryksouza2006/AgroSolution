import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { RiskJobContent } from '../../components/riskJobs/RiskJobContent';
import { RiskGuidanceSection } from '../../components/guidance/RiskGuidanceSection';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useRiskJob } from '../../hooks/riskJobs/useRiskJob';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJobsStackParamList } from '../../types/navigation';
import { isRiskJobNotFound, parseRiskJobError } from '../../utils/riskJobErrors';
import { alertStatusOf, isWaitingRiskJob } from '../../utils/riskJobPolicy';

export function RiskJobDetailsScreen({ route, navigation }: NativeStackScreenProps<RiskJobsStackParamList, 'RiskJobDetails'>) {
  const { theme } = useTheme();
  const { query, consult, consulting, timedOut, budgetExpired } = useRiskJob(route.params.jobId, route.params.cropAreaId);
  const job = query.data;
  if (query.isPending && !job && (!budgetExpired || query.isFetching)) return <ScreenContainer><LoadingState message="Consultando análise…" /></ScreenContainer>;
  if (!job || isRiskJobNotFound(query.error)) return <ScreenContainer><ErrorState message={parseRiskJobError(query.error)} onRetry={() => { void consult(); }} /></ScreenContainer>;
  return <ScreenContainer refreshing={consulting} onRefresh={() => { void consult(); }}>
    {query.isError && <ErrorState title="Não foi possível atualizar a análise" message={parseRiskJobError(query.error)} onRetry={() => { void consult(); }} />}
    {timedOut && <Text accessibilityRole="alert" style={[theme.typography.body, { color: theme.colors.text }]}>A análise ainda está em andamento</Text>}
    {!timedOut && !query.isError && isWaitingRiskJob(job.status) && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Aguardando o servidor. Consulta automática a cada 1,5 segundo, por até 60 segundos.</Text>}
    <AppButton title="Consultar novamente" variant="secondary" loading={consulting} disabled={query.isFetching} onPress={() => { void consult(); }} accessibilityHint="Consulta novamente esta mesma análise, sem solicitar uma nova" />
    <RiskJobContent job={job}>
      <RiskGuidanceSection key={route.params.jobId} jobId={route.params.jobId} job={job} disabled={query.isFetching} />
    </RiskJobContent>
    {(job.alert || alertStatusOf(job) !== null) && <AppButton title="Gerenciar alerta" variant="secondary"
      onPress={() => navigation.navigate('Alerts', { screen: 'AlertDetails', params: { jobId: route.params.jobId }, initial: false })} />}
  </ScreenContainer>;
}
