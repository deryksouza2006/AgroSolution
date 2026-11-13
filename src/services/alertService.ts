import type { AlertAction, RiskJob, RiskJobPage } from '../types/riskJob';
import { AppError } from '../utils/errors';
import { normalizeRiskJob, normalizeRiskJobPage, riskId, riskRecord } from '../utils/riskJobNormalization';
import { api } from './api';

const idPath = (id: number) => { if (!riskId(id)) throw new AppError('Recurso não encontrado ou indisponível.'); return String(id); };
export const alertService = {
  async list(cropAreaId: number | undefined, page: number, size: number, signal: AbortSignal): Promise<RiskJobPage> {
    const path = cropAreaId === undefined ? '/api/alerts' : `/api/crop-areas/${idPath(cropAreaId)}/alerts`;
    const { data } = await api.get<unknown>(path, { params: { page, size }, signal });
    return normalizeRiskJobPage(data, page, size);
  },
  async get(jobId: number, signal: AbortSignal): Promise<RiskJob> {
    const { data } = await api.get<unknown>(`/api/alerts/${idPath(jobId)}`, { signal });
    if (!riskRecord(data)) throw new AppError('A API retornou dados de alerta indisponíveis. Tente consultar novamente.');
    return normalizeRiskJob(data);
  },
  async change(jobId: number, action: AlertAction): Promise<void> {
    await api.patch<void>(`/api/alerts/${idPath(jobId)}/${action}`);
  },
};
