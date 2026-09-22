import { useState } from 'react';
import { sounds } from '../lib/sounds';

export function useSound() {
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());

  const toggleSound = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  return {
    isMuted,
    toggleSound,
    playCorrect: () => sounds.playCorrect(),
    playIncorrect: () => sounds.playIncorrect(),
    playTick: () => sounds.playTick(),
    playJoin: () => sounds.playJoin(),
    playFanfare: () => sounds.playFanfare(),
  };
}
