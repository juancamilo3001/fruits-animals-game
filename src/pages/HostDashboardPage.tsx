import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Users,
  Copy,
  Check,
  Eye,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  LogOut,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOrder } from '../components/AnswerOrder';
import { Podium } from '../components/Podium';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import { useHostSession } from '../hooks/useHostSession';
import { supabase } from '../lib/supabase';
import { LeaderboardEntry } from '../types/game';

export const HostDashboardPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const cleanCode = (roomCode || '').toUpperCase().trim();

  const { getHostTokenForRoom, saveHostSession, clearHostSession } = useHostSession();
  const [hostToken, setHostToken] = useState<string | null>(() => getHostTokenForRoom(cleanCode));
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [tokenAuthError, setTokenAuthError] = useState<string | null>(null);

  const {
    room,
    players,
    answers,
    currentQuestion,
    currentResult,
    loading,
    error,
    isChannelConnected,
  } = useRealtimeRoom(cleanCode);

  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Fetch Leaderboard when finished
  useEffect(() => {
    if (room?.status === 'FINISHED') {
      const fetchLeaderboard = async () => {
        const { data } = await supabase.rpc('get_room_leaderboard', {
          p_room_code: cleanCode,
        });
        if (data) {
          setLeaderboard(data as LeaderboardEntry[]);
        }
      };
      fetchLeaderboard();
    }
  }, [room?.status, cleanCode]);

  // Copy shareable join link
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/join/${cleanCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start Game
  const handleStartGame = async () => {
    if (!hostToken) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('start_game', {
        p_room_code: cleanCode,
        p_host_token: hostToken,
      });
      if (rpcErr) throw new Error(rpcErr.message);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to start game');
    } finally {
      setActionLoading(false);
    }
  };

  // Advance Game State
  const handleAdvance = async (action: 'SHOW_RESULTS' | 'NEXT_QUESTION' | 'PAUSE' | 'RESUME' | 'END_GAME') => {
    if (!hostToken) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('advance_game_state', {
        p_room_code: cleanCode,
        p_host_token: hostToken,
        p_action: action,
      });
      if (rpcErr) throw new Error(rpcErr.message);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit manual token
  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    saveHostSession({
      roomCode: cleanCode,
      hostToken: manualTokenInput.trim(),
    });
    setHostToken(manualTokenInput.trim());
    setTokenAuthError(null);
  };

  // Verify Host Authorization Screen
  if (!hostToken) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase mb-2">
              Host Authentication Required
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              To control Room <strong>{cleanCode}</strong>, you must provide the secret Host Token generated when the room was created.
            </p>

            <form onSubmit={handleManualTokenSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Host Secret Token (UUID)
                </label>
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors shadow"
              >
                Authenticate as Host
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs">
              <Link to="/join" className="text-emerald-400 hover:underline">
                Join as Player
              </Link>
              <Link to="/host" className="text-slate-400 hover:underline">
                Create New Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar roomCode={cleanCode} isHost isConnected={isChannelConnected} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mb-4" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Loading Host Control Panel...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Room Not Available
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {error || 'This room does not exist.'}
            </p>
            <Link
              to="/host"
              className="w-full inline-block py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Create New Room
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const answeredIds = new Set(answers.map((a) => a.player_id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar roomCode={cleanCode} isHost isConnected={isChannelConnected} />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Host Command Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Room & Status */}
          <div className="flex flex-wrap items-center gap-4 text-center md:text-left">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                HOST COMMAND CENTER
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-400">
                  {cleanCode}
                </span>
                <StatusBadge status={room.status} />
              </div>
            </div>

            {/* Quick Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors shadow-sm"
              title="Copy player join link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Join Link</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Key Stats */}
          <div className="flex items-center gap-3 text-center">
            <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                PLAYERS
              </span>
              <span className="text-xl font-black text-white">{players.length}</span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                QUESTION
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {String(room.current_question).padStart(2, '0')}/30
              </span>
            </div>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* HOST CONTROLS BAR                                                 */}
        {/* ================================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start Game */}
            {room.status === 'WAITING' && (
              <button
                onClick={handleStartGame}
                disabled={actionLoading || players.length === 0}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START GAME (Q1)</span>
              </button>
            )}

            {/* Show Results */}
            {room.status === 'QUESTION_ACTIVE' && (
              <button
                onClick={() => handleAdvance('SHOW_RESULTS')}
                disabled={actionLoading}
                className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all duration-150 active:scale-95 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>SHOW RESULTS</span>
              </button>
            )}

            {/* Next Question */}
            {room.status === 'QUESTION_RESULTS' && (
              <button
                onClick={() => handleAdvance('NEXT_QUESTION')}
                disabled={actionLoading}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-95 flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4 fill-current" />
                <span>
                  {room.current_question >= 30 ? 'FINISH GAME (RESULTS)' : `NEXT QUESTION (${room.current_question + 1}/30)`}
                </span>
              </button>
            )}

            {/* Pause / Resume */}
            {room.status === 'QUESTION_ACTIVE' && (
              <button
                onClick={() => handleAdvance('PAUSE')}
                disabled={actionLoading}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            {room.status === 'PAUSED' && (
              <button
                onClick={() => handleAdvance('RESUME')}
                disabled={actionLoading}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Game</span>
              </button>
            )}
          </div>

          {/* End Game Emergency Button */}
          {room.status !== 'FINISHED' && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to end the game and show final results?')) {
                  handleAdvance('END_GAME');
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-rose-900/60 text-rose-400 hover:bg-rose-950/60 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              End Game Now
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* MAIN HOST CONTENT: Active Game vs Lobby vs Finished               */}
        {/* ================================================================= */}
        {room.status === 'FINISHED' ? (
          <div className="w-full">
            <Podium
              leaderboard={leaderboard}
              onPlayAgain={() => navigate('/host')}
              isHost
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Question preview & Live Player Roster Grid */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Question Preview (if game started) */}
              {currentQuestion && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="text-xs font-black uppercase text-slate-400 mb-2">
                    ACTIVE QUESTION PREVIEW (Host View)
                  </div>
                  <QuestionCard
                    question={currentQuestion}
                    currentResult={currentResult}
                    totalQuestions={30}
                  />
                </div>
              )}

              {/* Requirement 23: Live Player Roster Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
                      PLAYER STATUS & SCOREBOARD ({players.length})
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Live Answer Tracking
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Response Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No players have joined yet. Share the room code: <strong>{cleanCode}</strong>
                          </td>
                        </tr>
                      ) : (
                        players.map((p) => {
                          const ans = answers.find((a) => a.player_id === p.id);
                          const hasAnswered = Boolean(ans);
                          const timeSec = ans ? (ans.response_time_ms / 1000).toFixed(2) + 's' : '—';

                          return (
                            <tr key={p.id} className="hover:bg-slate-800/40">
                              <td className="py-3 px-3 font-bold text-white">
                                {p.nickname}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-black text-amber-400">
                                {p.score.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {hasAnswered ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" /> ANSWERED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    WAITING
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-400">
                                {timeSec}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Live Realtime Answer Order */}
            <div className="flex flex-col gap-6">
              <AnswerOrder
                answers={answers}
                players={players}
                gameStatus={room.status}
                className="sticky top-20"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
