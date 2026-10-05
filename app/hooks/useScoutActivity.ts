/**
 * useScoutActivity.ts
 * Returns scout activity for the current athlete from the API.
 * Returns empty array until the scout activity API endpoint is built.
 */
import { useState, useEffect } from 'react';
import { ScoutActivity } from '../types';

export function useScoutActivity(athleteId: string) {
  const [activity, setActivity] = useState<ScoutActivity[]>([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    // TODO: fetch from GET /athlete/{id}/scout-activity when endpoint is ready
    setLoading(false);
    setActivity([]);
  }, [athleteId]);

  return { activity, loading };
}
