/**
 * useConnectionRequests.ts
 * Polls pending athlete connection requests for a scout or a coach — powers
 * the tab-bar badge and the home-screen banner ("in-app pop up" for a new
 * request, since there's no OS push-notification infra in this app).
 */
import { useCallback, useEffect, useState } from 'react';
import { scoutService } from '../services/scout.service';
import { coachService } from '../services/coach.service';
import { ConnectionRequest } from '../types';

const POLL_MS = 15000;

export function useConnectionRequests(role: 'scout' | 'coach', userId: string | null | undefined) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading,  setLoading]  = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) { setRequests([]); return; }
    const fetcher = role === 'scout' ? scoutService.getRequests : coachService.getRequests;
    const data = await fetcher(userId);
    setRequests(data);
  }, [role, userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
    const iv = setInterval(refresh, POLL_MS);
    return () => clearInterval(iv);
  }, [userId, refresh]);

  return { requests, count: requests.length, loading, refresh };
}
