import type { RiskJob } from '../types/riskJob';
import { AppError } from '../utils/errors';
import { GUIDANCE_REQUEST_TIMEOUT_MS } from '../utils/guidancePolicy';
import { normalizeRiskJob, riskId, riskRecord } from '../utils/riskJobNormalization';
import { api } from './api';

export const guidanceService = {
  async generate(jobId: number): Promise<RiskJob> {
    if (!riskId(jobId)) throw new AppError('Análise não encontrada ou indisponível.');
    const { data } = await api.post<unknown>(`/api/risk-jobs/${jobId}/guidance`, undefined, { timeout: GUIDANCE_REQUEST_TIMEOUT_MS });
    if (!riskRecord(data)) throw new AppError('A resposta da orientação está indisponível. Consulte a atualização da análise.');
    const job = normalizeRiskJob(data);
    if (job.id !== null && job.id !== jobId) throw new AppError('A resposta não corresponde à análise solicitada. Consulte a atualização.');
    return job;
  },
};
