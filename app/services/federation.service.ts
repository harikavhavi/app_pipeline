/**
 * federation.service.ts — returns empty data until real federation API is built.
 */
import { Athlete } from '../types';

export interface FederationEvent {
  id: string; title: string; date: string; location: string;
  sport: string; rsvpCount: number;
}

export const federationService = {
  getRegistry: async (): Promise<Athlete[]> => {
    return [];
  },

  getEvents: async (): Promise<FederationEvent[]> => {
    return [];
  },

  publishEvent: async (event: Omit<FederationEvent, 'id' | 'rsvpCount'>) => {
    await new Promise(r => setTimeout(r, 500));
    return { id: `evt_${Date.now()}`, ...event, rsvpCount: 0 };
  },
};
