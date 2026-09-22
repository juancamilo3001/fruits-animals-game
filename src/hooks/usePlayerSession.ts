import { useState, useEffect } from 'react';
import { PlayerSession } from '../types/game';

const STORAGE_KEY = 'fa_player_session';

export function usePlayerSession() {
  const [session, setSession] = useState<PlayerSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveSession = (newSession: PlayerSession) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
    } catch (e) {
      console.error('Failed to save player session', e);
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    } catch (e) {
      console.error('Failed to clear player session', e);
    }
  };

  return {
    session,
    saveSession,
    clearSession,
  };
}
