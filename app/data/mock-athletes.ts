// Types re-exported from canonical types file.
// Data removed — athlete profiles now come from the pipeline API.
import type { Athlete } from '../types';
export type { Athlete } from '../types';

/** @deprecated No mock athletes. Fetch real data via athleteService.getProfile() */
export const MOCK_ATHLETES: Athlete[] = [];
