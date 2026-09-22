import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Play, ArrowLeft, AlertCircle, RefreshCw, Sparkles, User, Hash } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { usePlayerSession } from '../hooks/usePlayerSession';
import { sounds } from '../lib/sounds';

export const JoinPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode: paramRoomCode } = useParams<{ roomCode?: string }>();
  const [searchParams] = useSearchParams();
  const queryRoomCode = searchParams.get('room') || searchParams.get('code') || '';

  const initialCode = (paramRoomCode || queryRoomCode || '').toUpperCase().trim();
  const [roomCode, setRoomCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, saveSession } = usePlayerSession();

  // If already has session matching current roomCode, allow fast rejoin
  const hasExistingSession =
    session &&
    roomCode &&
    session.roomCode.toUpperCase() === roomCode.toUpperCase();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanNick = nickname.trim();

    if (!cleanCode || cleanCode.length < 4) {
      setError('Please enter a valid room code (e.g. ABC123).');
      return;
    }

    if (!cleanNick || cleanNick.length < 2) {
      setError('Nickname must be at least 2 characters long.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Database is not connected. Please add your Supabase credentials in .env');
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('join_game_room', {
        p_room_code: cleanCode,
        p_nickname: cleanNick,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Unable to join room. Please check the code and try again.');
      }

      const joinedPlayer = Array.isArray(data) ? data[0] : data;
      if (!joinedPlayer?.player_id) {
        throw new Error('Could not retrieve player session from server.');
      }

      saveSession({
        roomCode: cleanCode,
        playerId: joinedPlayer.player_id,
        nickname: joinedPlayer.nickname,
      });

      sounds.playJoin();
      navigate(`/room/${cleanCode}`);
    } catch (err: unknown) {
      console.error('Error joining room:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while joining the room.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejoinExisting = () => {
    if (session) {
      navigate(`/room/${session.roomCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Back Link */}
        <div className="w-full mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </Link>
        </div>

        {/* Join Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              🎮
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              JOIN CHALLENGE
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your room code and nickname to enter the arena
            </p>
          </div>

          {/* Quick Rejoin Session Banner */}
          {hasExistingSession && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-bold block">Active Session Found</span>
                <span className="text-emerald-400/80">
                  Player: <strong>{session.nickname}</strong>
                </span>
              </div>
              <button
                onClick={handleRejoinExisting}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors shadow"
              >
                RECONNECT
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleJoin} className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Room Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 font-mono font-black text-base sm:text-lg text-emerald-400 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Nickname
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Carlos"
                  maxLength={25}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 font-bold text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] mt-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base tracking-wide uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>JOINING ROOM...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>ENTER ROOM</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
