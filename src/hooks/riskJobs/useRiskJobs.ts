import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { riskJobService } from '../../services/riskJobService';
import { riskJobKeys } from './riskJobKeys';

export function useRiskJobs(cropAreaId: number, page: number, size = 20) {
  return useQuery({ queryKey: riskJobKeys.list(cropAreaId, page, size), queryFn: ({ signal }) => riskJobService.list(cropAreaId, page, size, signal), placeholderData: keepPreviousData });
}
