import type { RiskGuidance, RiskJob } from '../types/riskJob';

export const GUIDANCE_REQUEST_TIMEOUT_MS = 180_000;
export const GUIDANCE_MUTATION_RETRY = false;
export interface GuidanceLocalState {
  response: RiskGuidance | null;
  uncertain: boolean;
  needsUpdate: boolean;
  blocked: boolean;
  error: string | null;
}
export const emptyGuidanceLocalState = (): GuidanceLocalState => ({ response: null, uncertain: false, needsUpdate: false, blocked: false, error: null });
export const isValidGuidance = (guidance: RiskGuidance | null | undefined): guidance is RiskGuidance & { fallback: false } => guidance != null && guidance.fallback === false;
export function effectiveGuidance(server: RiskGuidance | null | undefined, local: GuidanceLocalState): RiskGuidance | null {
  if (isValidGuidance(server)) return server;
  if (isValidGuidance(local.response)) return local.response;
  return local.response ?? server ?? null;
}
export function guidanceDecision(hasResult: boolean, server: RiskGuidance | null | undefined, local: GuidanceLocalState): 'show' | 'consult' | 'wait' | 'generate' | 'retry' {
  const guidance = effectiveGuidance(server, local);
  if (isValidGuidance(guidance)) return 'show';
  if (local.uncertain || local.needsUpdate || local.blocked || (guidance && guidance.fallback !== true && guidance.fallback !== false)) return 'consult';
  if (!hasResult) return 'wait';
  return guidance?.fallback === true ? 'retry' : 'generate';
}
export function guidanceLocalAfterResponse(previous: GuidanceLocalState, incoming: RiskGuidance | null, resultReady: boolean, fromConsult = false): GuidanceLocalState {
  const response = isValidGuidance(incoming) ? incoming : isValidGuidance(previous.response) ? previous.response
    : incoming?.fallback === true ? incoming : previous.response?.fallback === true ? previous.response : incoming ?? previous.response;
  if (!fromConsult && incoming === null) return { ...previous, response, uncertain: true, needsUpdate: true, error: 'A resposta não confirmou uma orientação. Consulte a atualização antes de solicitar novamente.' };
  return { response, uncertain: false, needsUpdate: !fromConsult && incoming !== null && incoming.fallback !== true && incoming.fallback !== false, blocked: fromConsult && !resultReady,
    error: fromConsult && !resultReady ? 'A análise ainda não terminou. Consulte a atualização antes de solicitar orientação.' : null };
}
// An explanation never replaces deterministic results, alerts or measurement snapshots.
export function attachGuidance(job: RiskJob, guidance: RiskGuidance): RiskJob { return { ...job, guidance }; }
export function preserveRiskOnGuidanceRefresh(current: RiskJob, incoming: RiskJob): RiskJob {
  return { ...incoming, demo: current.demo || incoming.demo, result: current.result ?? incoming.result, alert: incoming.alert ?? current.alert,
    measurements: incoming.measurements.length ? incoming.measurements : current.measurements, rainfall: incoming.rainfall ?? current.rainfall };
}
