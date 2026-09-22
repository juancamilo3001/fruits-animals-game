import { useState } from 'react';
import { HostSession } from '../types/game';

const STORAGE_KEY = 'fa_host_session';

export function useHostSession() {
  const [session, setSession] = useState<HostSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveHostSession = (newSession: HostSession) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
    } catch (e) {
      console.error('Failed to save host session', e);
    }
  };

  const getHostTokenForRoom = (roomCode: string): string | null => {
    if (session && session.roomCode.toUpperCase() === roomCode.toUpperCase()) {
      return session.hostToken;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.roomCode.toUpperCase() === roomCode.toUpperCase()) {
          return parsed.hostToken;
        }
      }
    } catch {}
    return null;
  };

  const clearHostSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    } catch (e) {
      console.error('Failed to clear host session', e);
    }
  };

  return {
    session,
    saveHostSession,
    getHostTokenForRoom,
    clearHostSession,
  };
}
