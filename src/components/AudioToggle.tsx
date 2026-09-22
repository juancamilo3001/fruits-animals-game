import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export const AudioToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isMuted, toggleSound } = useSound();

  return (
    <button
      onClick={toggleSound}
      title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      className={`p-2 rounded-xl transition-all duration-200 border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shadow-sm flex items-center justify-center ${className}`}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-rose-400" />
      ) : (
        <Volume2 className="w-5 h-5 text-emerald-400" />
      )}
    </button>
  );
};
