import { useEffect, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '../../components/AppButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { RiskJobContent } from '../../components/riskJobs/RiskJobContent';
import { RiskGuidanceSection } from '../../components/guidance/RiskGuidanceSection';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAlert } from '../../hooks/alerts/useAlert';
import { useAcknowledgeAlert } from '../../hooks/alerts/useAcknowledgeAlert';
import { useResolveAlert } from '../../hooks/alerts/useResolveAlert';
import { useTheme } from '../../hooks/useTheme';
import type { AlertAction } from '../../types/riskJob';
import type { AlertsStackParamList } from '../../types/navigation';
import { isRiskJobNotFound, parseRiskJobError } from '../../utils/riskJobErrors';
import { alertStatusOf, canChangeAlert } from '../../utils/riskJobPolicy';

export function AlertDetailsScreen({ route }: NativeStackScreenProps<AlertsStackParamList, 'AlertDetails'>) {
  const { theme } = useTheme();
  const query = useAlert(route.params.jobId);
  const acknowledge = useAcknowledgeAlert(), resolve = useResolveAlert();
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useRef(false), working = useRef(false), confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const job = query.data;
  const status = job ? alertStatusOf(job) : null;
  const pending = acknowledge.isPending || resolve.isPending;
  const blocked = pending || query.isFetching || query.isError;
  const change = async (action: AlertAction) => {
    if (!mounted.current || working.current || !job || blocked || !canChangeAlert(status, action)) return;
    working.current = true; setActionError(null); setNotice(null);
    try {
      const input = { jobId: route.params.jobId, cropAreaId: job.cropAreaId };
      if (action === 'acknowledge') await acknowledge.mutateAsync(input); else await resolve.mutateAsync(input);
      if (mounted.current) setNotice(action === 'acknowledge' ? 'Reconhecimento enviado. O estado exibido é o informado pela API.' : 'Resolução enviada. O risco continua sendo o informado no resultado.');
    } catch (error: unknown) { if (mounted.current) setActionError(parseRiskJobError(error)); }
    finally { working.current = false; }
  };
  const confirmResolve = () => {
    if (blocked || working.current || confirming.current || !canChangeAlert(status, 'resolve')) return;
    confirming.current = true;
    Alert.alert('Resolver alerta?', 'Confirmar a resolução administrativa deste alerta? Isso não altera a classificação de risco calculada pelo servidor.', [
      { text: 'Cancelar', style: 'cancel', onPress: () => { confirming.current = false; } },
      { text: 'Resolver alerta', onPress: () => { confirming.current = false; void change('resolve'); } },
    ], { cancelable: true, onDismiss: () => { confirming.current = false; } });
  };
  if (query.isPending && !job) return <ScreenContainer><LoadingState message="Carregando alerta…" /></ScreenContainer>;
  if (!job || isRiskJobNotFound(query.error)) return <ScreenContainer><ErrorState message={parseRiskJobError(query.error)} onRetry={() => { void query.refetch(); }} /></ScreenContainer>;
  return <ScreenContainer refreshing={query.isRefetching} onRefresh={() => { if (!pending && !query.isFetching) void query.refetch(); }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>Detalhes do alerta</Text>
    {query.isError && <ErrorState title="Não foi possível atualizar o alerta" message={parseRiskJobError(query.error)} onRetry={() => { void query.refetch(); }} />}
    {notice && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.text }]}>{notice}</Text>}
    {actionError && <ErrorState title="Não foi possível alterar o alerta" message={actionError} />}
    <AppButton title={acknowledge.isPending ? 'Reconhecendo…' : 'Reconhecer alerta'} variant="secondary" loading={acknowledge.isPending} disabled={blocked || !canChangeAlert(status, 'acknowledge')} onPress={() => { void change('acknowledge'); }} />
    <AppButton title={resolve.isPending ? 'Resolvendo…' : 'Resolver alerta'} loading={resolve.isPending} disabled={blocked || !canChangeAlert(status, 'resolve')} onPress={confirmResolve} />
    <AppButton title="Atualizar alerta" variant="secondary" disabled={pending || query.isFetching} onPress={() => { void query.refetch(); }} />
    <RiskJobContent job={job}>
      <RiskGuidanceSection key={route.params.jobId} jobId={route.params.jobId} job={job} alert disabled={pending || query.isFetching} />
    </RiskJobContent>
  </ScreenContainer>;
}
