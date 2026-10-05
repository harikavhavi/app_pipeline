/**
 * log.service.ts
 * Scout and Coach athlete log entries — private per-role notes about athletes.
 */
import { API_BASE } from './api';
import { AthleteLogEntry, LogEntryTag } from '../types';

// ─── Local in-memory mock store ───────────────────────────────────────────────
const mockLogs: Record<string, AthleteLogEntry[]> = {};

function makeKey(authorId: string, athleteId: string) {
  return `${authorId}::${athleteId}`;
}

export const logService = {
  /** Fetch all log entries for an athlete written by a specific scout/coach */
  async getEntries(authorId: string, athleteId: string): Promise<AthleteLogEntry[]> {
    try {
      const res = await fetch(
        `${API_BASE}/athlete-logs?author_id=${authorId}&athlete_id=${athleteId}`,
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.logs ?? [];
    } catch {
      return mockLogs[makeKey(authorId, athleteId)] ?? [];
    }
  },

  /** Add a new log entry */
  async addEntry(
    authorId: string,
    authorRole: 'coach' | 'scout',
    athleteId: string,
    note: string,
    tags: LogEntryTag[],
    sessionId?: string,
  ): Promise<AthleteLogEntry> {
    const entry: AthleteLogEntry = {
      id:         `log_${Date.now()}`,
      authorId,
      authorRole,
      athleteId,
      sessionId:  sessionId ?? null,
      date:       new Date().toISOString().split('T')[0],
      note,
      tags,
      createdAt:  new Date().toISOString(),
    };
    try {
      const res = await fetch(`${API_BASE}/athlete-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: authorId, author_role: authorRole,
          athlete_id: athleteId, note, tags, session_id: sessionId,
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data;
    } catch {
      const key = makeKey(authorId, athleteId);
      mockLogs[key] = [entry, ...(mockLogs[key] ?? [])];
      return entry;
    }
  },

  /** Delete a log entry */
  async deleteEntry(entryId: string, authorId: string, athleteId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/athlete-logs/${entryId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      const key = makeKey(authorId, athleteId);
      mockLogs[key] = (mockLogs[key] ?? []).filter(e => e.id !== entryId);
      return true;
    }
  },
};
