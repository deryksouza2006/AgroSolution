import type { RiskJob, RiskJobPage } from '../types/riskJob';
import { AppError } from '../utils/errors';
import { normalizeRiskJob, normalizeRiskJobPage, riskId, riskRecord } from '../utils/riskJobNormalization';
import { api } from './api';

const idPath = (id: number) => {
  if (!riskId(id)) throw new AppError('Recurso não encontrado ou indisponível.');
  return String(id);
};
function jobResponse(data: unknown): RiskJob {
  if (!riskRecord(data)) throw new AppError('A API retornou dados de análise indisponíveis. Tente consultar novamente.');
  return normalizeRiskJob(data);
}
export const riskJobService = {
  async create(cropAreaId: number): Promise<RiskJob> {
    const { data } = await api.post<unknown>(`/api/crop-areas/${idPath(cropAreaId)}/risk-jobs`);
    const job = jobResponse(data);
    if (job.id === null) throw new AppError('A análise foi solicitada, mas a API não informou o identificador. Consulte o histórico antes de solicitar outra análise.');
    return job;
  },
  async get(jobId: number, signal: AbortSignal): Promise<RiskJob> {
    const { data } = await api.get<unknown>(`/api/risk-jobs/${idPath(jobId)}`, { signal });
    return jobResponse(data);
  },
  async list(cropAreaId: number, page: number, size: number, signal: AbortSignal): Promise<RiskJobPage> {
    const { data } = await api.get<unknown>(`/api/crop-areas/${idPath(cropAreaId)}/risk-jobs`, { params: { page, size }, signal });
    return normalizeRiskJobPage(data, page, size);
  },
};
