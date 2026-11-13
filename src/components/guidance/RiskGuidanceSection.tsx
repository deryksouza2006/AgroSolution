import { Text, View } from 'react-native';
import { useGuidance } from '../../hooks/riskJobs/useGuidance';
import { useTheme } from '../../hooks/useTheme';
import type { RiskJob } from '../../types/riskJob';
import { AppButton } from '../AppButton';
import { ErrorState } from '../feedback/ErrorState';
import { GuidanceContent } from './GuidanceContent';

export function RiskGuidanceSection({ jobId, job, alert = false, disabled = false }: { jobId: number; job: RiskJob; alert?: boolean; disabled?: boolean }) {
  const { theme } = useTheme();
  const { guidance, decision, local, pending, checking, generate, consult } = useGuidance(jobId, job);
  if (!job.result && !guidance && !local.needsUpdate && !pending) return null;
  return <View style={{ gap: theme.spacing.lg }}>
    <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{alert ? 'Entender alerta' : 'Entender análise'}</Text>
    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>O risco é calculado pelo servidor. A IA fornece uma explicação contextual, sem substituir a classificação determinística ou a avaliação agronômica.</Text>
    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Conteúdo histórico da análise #{jobId}. Uma nova condição do talhão exige uma nova análise.</Text>
    {guidance && <GuidanceContent guidance={guidance} />}
    {pending && <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.text }]}>Solicitando orientação. A operação pode levar alguns segundos; aguarde a conclusão.</Text>}
    {decision !== 'show' && local.error && <ErrorState title={local.uncertain ? 'Resultado da solicitação incerto' : 'Orientação indisponível'} message={local.error} />}
    {(decision === 'generate' || decision === 'retry') && <AppButton title={pending ? 'Solicitando orientação…' : decision === 'retry' ? 'Tentar novamente' : alert ? 'Entender alerta' : 'Entender análise'}
      loading={pending} disabled={disabled || checking || pending} onPress={() => { void generate(); }} accessibilityHint="Solicita explicitamente a orientação contextual desta análise" />}
    <AppButton title={checking ? 'Consultando atualização…' : 'Consultar atualização'} variant="secondary" loading={checking} disabled={disabled || pending || checking}
      onPress={() => { void consult(); }} accessibilityHint="Consulta a análise original, sem solicitar outra orientação" />
  </View>;
}
