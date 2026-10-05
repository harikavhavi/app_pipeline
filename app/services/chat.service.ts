/**
 * chat.service.ts
 * REST + polling chat between an athlete and a connected scout/coach.
 * Only works once the underlying connection status is "accepted" — the
 * backend returns 403 otherwise.
 */
import { API_BASE } from './api';
import { ChatMessage } from '../types';

export const chatService = {
  getThread: async (threadType: 'scout' | 'coach', athleteId: string, counterpartId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetch(
        `${API_BASE}/messages?thread_type=${threadType}&athlete_id=${athleteId}&counterpart_id=${counterpartId}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages ?? [];
    } catch {
      return [];
    }
  },

  sendMessage: async (
    threadType: 'scout' | 'coach',
    athleteId: string,
    counterpartId: string,
    senderId: string,
    body: string,
  ): Promise<ChatMessage | null> => {
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_type: threadType,
          athlete_id: athleteId,
          counterpart_id: counterpartId,
          sender_id: senderId,
          body,
        }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
};
