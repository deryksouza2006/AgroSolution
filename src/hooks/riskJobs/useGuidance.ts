import { useRef, useState, useEffect } from 'react';
import { skipToken, useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { guidanceService } from '../../services/guidanceService';
import { riskJobService } from '../../services/riskJobService';
import type { RiskGuidance, RiskJob } from '../../types/riskJob';
import { AppError } from '../../utils/errors';
import { guidanceFailureKind, parseGuidanceError } from '../../utils/guidanceErrors';
import { attachGuidance, effectiveGuidance, emptyGuidanceLocalState, GUIDANCE_MUTATION_RETRY, guidanceDecision, guidanceLocalAfterResponse, isValidGuidance, preserveRiskOnGuidanceRefresh, type GuidanceLocalState } from '../../utils/guidancePolicy';
import { useAuth } from '../auth/useAuth';
import { alertKeys } from '../alerts/alertKeys';
import { dashboardKeys } from '../dashboard/dashboardKeys';
import { guidanceKeys } from './guidanceKeys';
import { riskJobKeys } from './riskJobKeys';

export function useGuidance(jobId: number, job: RiskJob) {
  const client = useQueryClient();
  const { session, isSessionCurrent } = useAuth();
  const mounted = useRef(false), submitting = useRef(false), consulting = useRef(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Ephemeral UI state: never persisted to storage or inserted as RiskJob.guidance.
  // Logout clears this cache with the rest of the session.
  const localQuery = useQuery({ queryKey: guidanceKeys.local(jobId), queryFn: skipToken, initialData: emptyGuidanceLocalState,
    staleTime: Infinity, gcTime: 5 * 60_000 });
  const local = localQuery.data ?? emptyGuidanceLocalState();
  const getLocal = () => client.getQueryData<GuidanceLocalState>(guidanceKeys.local(jobId)) ?? emptyGuidanceLocalState();
  const writeLocal = (update: (state: GuidanceLocalState) => GuidanceLocalState) => {
    if (isSessionCurrent(session)) client.setQueryData<GuidanceLocalState>(guidanceKeys.local(jobId), previous => update(previous ?? emptyGuidanceLocalState()));
  };
  const publishValid = async (guidance: RiskGuidance, snapshot: RiskJob) => {
    if (!isSessionCurrent(session) || !isValidGuidance(guidance)) return;
    await Promise.all([client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true }), client.cancelQueries({ queryKey: alertKeys.detail(jobId), exact: true })]);
    if (!isSessionCurrent(session)) return;
    client.setQueryData<RiskJob>(riskJobKeys.detail(jobId), previous => attachGuidance(previous ?? snapshot, guidance));
    client.setQueryData<RiskJob>(alertKeys.detail(jobId), previous => previous ? attachGuidance(previous, guidance) : undefined);
    void client.invalidateQueries({ queryKey: riskJobKeys.all });
    void client.invalidateQueries({ queryKey: alertKeys.all });
    void client.invalidateQueries({ queryKey: dashboardKeys.all });
  };
  const mutation = useMutation({
    mutationKey: guidanceKeys.mutation(jobId), mutationFn: ({ jobId }: { jobId: number; snapshot: RiskJob }) => guidanceService.generate(jobId),
    retry: GUIDANCE_MUTATION_RETRY, networkMode: 'always', gcTime: 0,
    onSuccess: async (response, input) => {
      if (!isSessionCurrent(session)) return;
      const guidance = response.guidance ?? null;
      writeLocal(previous => guidanceLocalAfterResponse(previous, guidance, Boolean(input.snapshot.result)));
      if (isValidGuidance(guidance)) await publishValid(guidance, input.snapshot);
    },
    onError: error => {
      const kind = guidanceFailureKind(error);
      writeLocal(previous => ({ ...previous, needsUpdate: true, uncertain: kind === 'uncertain', blocked: kind === 'conflict', error: parseGuidanceError(error) }));
    },
  });
  const requests = useIsMutating({ mutationKey: guidanceKeys.mutation(jobId), exact: true });
  const consult = async () => {
    if (consulting.current || client.isMutating({ mutationKey: guidanceKeys.mutation(jobId), exact: true }) || !isSessionCurrent(session)) return;
    consulting.current = true;
    if (mounted.current) setChecking(true);
    try {
      await client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true });
      if (!isSessionCurrent(session)) return;
      let resultReady = false;
      const refreshed = await client.fetchQuery({
        queryKey: riskJobKeys.detail(jobId), retry: false, staleTime: 0, networkMode: 'always',
        queryFn: async ({ signal }) => {
          const fresh = await riskJobService.get(jobId, signal);
          if (fresh.id !== null && fresh.id !== jobId) throw new AppError('A resposta não corresponde à análise consultada.');
          resultReady = Boolean(fresh.result);
          const current = client.getQueryData<RiskJob>(riskJobKeys.detail(jobId)) ?? job;
          return preserveRiskOnGuidanceRefresh(current, fresh);
        },
      });
      if (!isSessionCurrent(session)) return;
      writeLocal(previous => guidanceLocalAfterResponse(previous, refreshed.guidance ?? null, resultReady, true));
      if (isValidGuidance(refreshed.guidance)) await publishValid(refreshed.guidance, refreshed);
      else {
        // This GET may legitimately contain guidance=null after fallback. Keep it only in local UI state.
        client.setQueryData<RiskJob>(alertKeys.detail(jobId), previous => previous ? preserveRiskOnGuidanceRefresh(previous, refreshed) : undefined);
      }
    } catch (error: unknown) {
      writeLocal(previous => ({ ...previous, needsUpdate: true, error: parseGuidanceError(error) }));
    } finally {
      consulting.current = false;
      if (mounted.current) setChecking(false);
    }
  };
  const generate = async () => {
    if (submitting.current || consulting.current || client.isMutating({ mutationKey: guidanceKeys.mutation(jobId), exact: true }) || !isSessionCurrent(session)) return;
    const cached = client.getQueryData<RiskJob>(riskJobKeys.detail(jobId));
    const alert = client.getQueryData<RiskJob>(alertKeys.detail(jobId));
    const serverGuidance = isValidGuidance(cached?.guidance) ? cached.guidance : isValidGuidance(alert?.guidance) ? alert.guidance : job.guidance;
    const current = cached?.result ? cached : job;
    const action = guidanceDecision(Boolean(current.result), serverGuidance, getLocal());
    if (action !== 'generate' && action !== 'retry') return;
    submitting.current = true;
    writeLocal(previous => ({ ...previous, error: null }));
    try { await mutation.mutateAsync({ jobId, snapshot: current }); }
    catch (error: unknown) {
      // 409 refreshes this same job exactly once; it never repeats generation.
      if (guidanceFailureKind(error) === 'conflict') await consult();
    } finally { submitting.current = false; }
  };
  return { guidance: effectiveGuidance(job.guidance, local), decision: guidanceDecision(Boolean(job.result), job.guidance, local), local,
    pending: requests > 0 || mutation.isPending, checking, generate, consult };
}
