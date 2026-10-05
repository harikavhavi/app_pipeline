// Types re-exported from canonical types file.
// Data removed — all sessions now come from the pipeline API (parasync.db).
import type { MetricCard, Session } from '../types';
export type { MetricCard, Session } from '../types';

/** @deprecated No mock sessions. Fetch real data via athleteService.getSessions() */
export const MOCK_SESSIONS: Session[] = [];
