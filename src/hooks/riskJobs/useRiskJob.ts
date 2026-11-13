import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { riskJobService } from '../../services/riskJobService';
import { isTerminalRiskJob, isWaitingRiskJob, riskPollingExpired, RISK_POLL_INTERVAL_MS, RISK_POLL_TIMEOUT_MS, shouldPollRiskJob } from '../../utils/riskJobPolicy';
import { alertKeys } from '../alerts/alertKeys';
import { cropAreaKeys } from '../cropAreas/cropAreaKeys';
import { dashboardKeys } from '../dashboard/dashboardKeys';
import { riskJobKeys } from './riskJobKeys';

export function useRiskJob(jobId: number, cropAreaId?: number) {
  const client = useQueryClient();
  const focused = useIsFocused();
  const [active, setActive] = useState(() => AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const [window, setWindow] = useState(() => ({ jobId, startedAt: Date.now(), expired: false }));
  const manualRequest = useRef(false);
  const mounted = useRef(false);
  const [consulting, setConsulting] = useState(false);
  const notified = useRef<string | null>(null);
  const visible = focused && active;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  useEffect(() => { setWindow(previous => previous.jobId === jobId ? previous : { jobId, startedAt: Date.now(), expired: false }); }, [jobId]);
  useEffect(() => {
    if (!visible) { void client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true }); return; }
    if (window.jobId !== jobId) return;
    const deadline = setTimeout(() => {
      setWindow(previous => ({ ...previous, expired: true }));
      void client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true });
    }, Math.max(0, RISK_POLL_TIMEOUT_MS - (Date.now() - window.startedAt)));
    return () => {
      clearTimeout(deadline);
      void client.cancelQueries({ queryKey: riskJobKeys.detail(jobId), exact: true });
    };
  }, [visible, jobId, window.jobId, window.startedAt, client]);

  const budgetExpired = window.expired || riskPollingExpired(window.startedAt, Date.now());

  const query = useQuery({
    queryKey: riskJobKeys.detail(jobId), queryFn: ({ signal }) => riskJobService.get(jobId, signal),
    enabled: visible && window.jobId === jobId && !budgetExpired, retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    refetchInterval: query => query.state.status !== 'error' && shouldPollRiskJob(query.state.data?.status, window.startedAt, Date.now(), visible && !window.expired, query.state.fetchStatus !== 'idle') ? RISK_POLL_INTERVAL_MS : false,
  });
  useEffect(() => {
    const job = query.data;
    const key = `${jobId}-${job?.status}`;
    if (!visible || !isTerminalRiskJob(job?.status) || notified.current === key) return;
    notified.current = key;
    void client.invalidateQueries({ queryKey: riskJobKeys.lists() });
    void client.invalidateQueries({ queryKey: alertKeys.all });
    void client.invalidateQueries({ queryKey: dashboardKeys.all });
    void client.invalidateQueries({ queryKey: cropAreaKeys.lists() });
    const id = job?.cropAreaId ?? cropAreaId;
    if (id) void client.invalidateQueries({ queryKey: cropAreaKeys.detail(id) });
  }, [query.data, jobId, cropAreaId, visible, client]);

  const consult = async () => {
    if (!visible || manualRequest.current || client.isFetching({ queryKey: riskJobKeys.detail(jobId), exact: true })) return;
    manualRequest.current = true;
    setConsulting(true);
    try { await query.refetch({ cancelRefetch: false }); }
    finally { manualRequest.current = false; if (mounted.current) setConsulting(false); }
  };
  return { query, consult, consulting, budgetExpired, timedOut: budgetExpired && isWaitingRiskJob(query.data?.status) };
}
