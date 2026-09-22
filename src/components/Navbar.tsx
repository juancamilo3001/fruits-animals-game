import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Wifi, WifiOff, LogOut, Shield } from 'lucide-react';
import { AudioToggle } from './AudioToggle';

interface NavbarProps {
  roomCode?: string;
  isHost?: boolean;
  isConnected?: boolean;
  onLeave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  isHost = false,
  isConnected = true,
  onLeave,
}) => {
  const navigate = useNavigate();

  const handleLeave = () => {
    if (onLeave) {
      onLeave();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            🦁
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                FRUITS & ANIMALS
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse hidden sm:inline-block" />
            </div>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-emerald-400/90 -mt-0.5">
              English Challenge
            </p>
          </div>
        </Link>

        {/* Center: Room Code Display if inside room */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ROOM:
            </span>
            <span className="font-mono font-black text-sm sm:text-base tracking-widest text-emerald-400">
              {roomCode}
            </span>
            {isHost && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Shield className="w-3 h-3" /> HOST
              </span>
            )}
          </div>
        )}

        {/* Right Actions: Connection status, sound toggle, leave button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection status */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title={isConnected ? 'Connected to Realtime' : 'Reconnecting...'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span>Offline</span>
              </>
            )}
          </div>

          <AudioToggle />

          {roomCode && (
            <button
              onClick={handleLeave}
              className="p-2 rounded-xl border border-slate-700/60 bg-slate-800/80 hover:bg-rose-900/40 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
