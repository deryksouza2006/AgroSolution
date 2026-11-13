import type { AlertAction, RiskJob } from '../types/riskJob';

export const RISK_POLL_INTERVAL_MS = 1500;
export const RISK_POLL_TIMEOUT_MS = 60_000;
export const isWaitingRiskJob = (status: string | null | undefined) => status === 'PENDING' || status === 'QUEUED' || status === 'PROCESSING';
export const isTerminalRiskJob = (status: string | null | undefined) => status === 'COMPLETED_WITHOUT_AI' || status === 'COMPLETED' || status === 'FAILED';
export function riskPollingExpired(startedAt: number, now: number): boolean { return now - startedAt >= RISK_POLL_TIMEOUT_MS; }
export function shouldPollRiskJob(status: string | null | undefined, startedAt: number, now: number, visible: boolean, fetching = false): boolean {
  return visible && !fetching && isWaitingRiskJob(status) && !riskPollingExpired(startedAt, now);
}
export function alertStatusOf(job: Pick<RiskJob, 'alert' | 'alertStatus'>): string | null { return job.alert?.status ?? job.alertStatus; }
export function canChangeAlert(status: string | null | undefined, action: AlertAction): boolean {
  if (action === 'acknowledge') return status === 'OPEN';
  return action === 'resolve' && (status === 'OPEN' || status === 'ACKNOWLEDGED');
}
