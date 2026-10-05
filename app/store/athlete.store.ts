import { create } from "zustand";
import { Session }       from "../types";
import { Athlete }       from "../types";
import { ScoutActivity } from "../types";

interface AthleteState {
  profile: Athlete | null;
  sessions: Session[];
  scoutActivity: ScoutActivity[];
  setProfile: (a: Athlete) => void;
  setSessions: (sessions: Session[]) => void;
  setScoutActivity: (activity: ScoutActivity[]) => void;
  /** @deprecated Use setSessions() after fetching from athleteService */
  loadSessions: (athleteId: string) => void;
}

export const useAthleteStore = create<AthleteState>((set) => ({
  profile: null,
  sessions: [],
  scoutActivity: [],
  setProfile: (profile) => set({ profile }),
  setSessions: (sessions) => set({ sessions }),
  setScoutActivity: (scoutActivity) => set({ scoutActivity }),
  // Kept for backwards compat — no-op now (callers should use setSessions)
  loadSessions: (_id: string) => set({ sessions: [], scoutActivity: [] }),
}));
