import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { alertService } from '../../services/alertService';
import { alertKeys } from './alertKeys';

export function useAlerts(cropAreaId: number | undefined, page: number, size = 20) {
  return useQuery({ queryKey: alertKeys.list(cropAreaId, page, size), queryFn: ({ signal }) => alertService.list(cropAreaId, page, size, signal), placeholderData: keepPreviousData });
}
