import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useCreateRiskJob } from '../../hooks/riskJobs/useCreateRiskJob';
import { useTheme } from '../../hooks/useTheme';
import { parseRiskJobError } from '../../utils/riskJobErrors';
import { AppButton } from '../AppButton';
import { ErrorState } from '../feedback/ErrorState';

export function AnalyzeRiskButton({ cropAreaId, disabled = false, onCreated }: { cropAreaId: number; disabled?: boolean; onCreated: (jobId: number) => void }) {
  const { theme } = useTheme();
  const create = useCreateRiskJob();
  const mounted = useRef(false), submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const request = async () => {
    if (disabled || submitting.current || create.isPending) return;
    submitting.current = true;
    setError(null);
    try {
      const job = await create.mutateAsync(cropAreaId);
      if (mounted.current && job.id !== null) onCreated(job.id);
    } catch (error: unknown) { if (mounted.current) setError(parseRiskJobError(error)); }
    finally { submitting.current = false; }
  };
  return <View style={{ gap: theme.spacing.md }}>
    {error && <ErrorState title="Não foi possível solicitar a análise" message={error} />}
    <AppButton title={create.isPending ? 'Solicitando análise…' : 'Analisar risco hídrico'} loading={create.isPending} disabled={disabled}
      onPress={() => { void request(); }} accessibilityHint="Solicita uma análise determinística e abre o processamento retornado pelo servidor" />
  </View>;
}
