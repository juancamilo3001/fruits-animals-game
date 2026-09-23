import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const TOTAL_QUESTIONS = 40;
const QUESTION_TIME_LIMIT_MS = 15_000;
const RESULTS_DISPLAY_MS = 4_000;

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
  const autoAdvanceRef = useRef<string | null>(null);

  // Obtener leaderboard cuando finaliza el juego
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

  // Copiar enlace de unión
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/join/${cleanCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Iniciar juego
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
      setActionError(err instanceof Error ? err.message : 'Error al iniciar el juego');
    } finally {
      setActionLoading(false);
    }
  };

  // Avanzar estado del juego
  const handleAdvance = useCallback(
    async (action: 'SHOW_RESULTS' | 'NEXT_QUESTION' | 'PAUSE' | 'RESUME' | 'END_GAME') => {
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
        setActionError(err instanceof Error ? err.message : 'Error al avanzar el estado');
      } finally {
        setActionLoading(false);
      }
    },
    [cleanCode, hostToken]
  );

  // =====================================================================
  // AVANCE AUTOMÁTICO CASO A: Todos respondieron antes de 15 segundos
  // =====================================================================
  useEffect(() => {
    if (!room || !hostToken || room.status !== 'QUESTION_ACTIVE') return;
    if (players.length === 0) return;

    // Si todos los jugadores ya respondieron esta pregunta → avanzar inmediatamente
    const answeredCount = answers.filter(
      (a) => a.question_number === room.current_question
    ).length;

    if (answeredCount >= players.length) {
      const key = `${cleanCode}-${room.current_question}-results`;
      if (autoAdvanceRef.current !== key) {
        autoAdvanceRef.current = key;
        handleAdvance('SHOW_RESULTS');
      }
    }
  }, [answers, players, room, cleanCode, hostToken, handleAdvance]);

  // =====================================================================
  // AVANCE AUTOMÁTICO CASO B/C: Timer de 15 segundos (fallback)
  // No correr si está PAUSED
  // =====================================================================
  useEffect(() => {
    if (!room || !hostToken || room.status !== 'QUESTION_ACTIVE') return;
    if (!room.question_started_at) return;

    const startedAt = new Date(room.question_started_at).getTime();
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, QUESTION_TIME_LIMIT_MS - elapsed);

    const key = `${cleanCode}-${room.current_question}-results`;

    if (remaining === 0) {
      if (autoAdvanceRef.current !== key) {
        autoAdvanceRef.current = key;
        handleAdvance('SHOW_RESULTS');
      }
      return;
    }

    const timer = window.setTimeout(() => {
      if (autoAdvanceRef.current !== key) {
        autoAdvanceRef.current = key;
        handleAdvance('SHOW_RESULTS');
      }
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [
    room?.status,
    room?.current_question,
    room?.question_started_at,
    cleanCode,
    hostToken,
    handleAdvance,
  ]);

  // =====================================================================
  // AVANCE AUTOMÁTICO: Resultados → Siguiente pregunta (4 segundos)
  // =====================================================================
  useEffect(() => {
    if (!room || !hostToken || room.status !== 'QUESTION_RESULTS') return;

    const key = `${cleanCode}-${room.current_question}-next`;

    if (autoAdvanceRef.current === key) return;

    const timer = window.setTimeout(() => {
      if (autoAdvanceRef.current !== key) {
        autoAdvanceRef.current = key;
        handleAdvance('NEXT_QUESTION');
      }
    }, RESULTS_DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    room?.status,
    room?.current_question,
    cleanCode,
    hostToken,
    handleAdvance,
  ]);

  // Enviar token manualmente
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

  // Pantalla de autenticación del host
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
              Autenticación de Host
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Para controlar la Sala <strong>{cleanCode}</strong>, debes proporcionar el Token Secreto de Host generado al crear la sala.
            </p>

            <form onSubmit={handleManualTokenSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Token Secreto del Host (UUID)
                </label>
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="ej. 550e8400-e29b-41d4-a716-446655440000"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors shadow"
              >
                Autenticarse como Host
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs">
              <Link to="/join" className="text-emerald-400 hover:underline">
                Unirse como Jugador
              </Link>
              <Link to="/host" className="text-slate-400 hover:underline">
                Crear Nueva Sala
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cargando
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar roomCode={cleanCode} isHost isConnected={isChannelConnected} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mb-4" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Cargando Panel de Control del Host...
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
              Sala No Disponible
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {error || 'Esta sala no existe.'}
            </p>
            <Link
              to="/host"
              className="w-full inline-block py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Crear Nueva Sala
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
        {/* Encabezado del Host */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-center md:text-left">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 block">
                PANEL DE CONTROL DEL HOST
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-400">
                  {cleanCode}
                </span>
                <StatusBadge status={room.status} />
              </div>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors shadow-sm"
              title="Copiar enlace de unión"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Enlace de Unión</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-center">
            <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                JUGADORES
              </span>
              <span className="text-xl font-black text-white">{players.length}</span>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                PREGUNTA
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {String(room.current_question).padStart(2, '0')}/{TOTAL_QUESTIONS}
              </span>
            </div>
          </div>
        </div>

        {/* Banner de error de acción */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* CONTROLES DEL HOST                                           */}
        {/* ============================================================ */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Iniciar juego */}
            {room.status === 'WAITING' && (
              <button
                onClick={handleStartGame}
                disabled={actionLoading || players.length === 0}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR JUEGO (P1)</span>
              </button>
            )}

            {/* Mostrar resultados */}
            {room.status === 'QUESTION_ACTIVE' && (
              <button
                onClick={() => handleAdvance('SHOW_RESULTS')}
                disabled={actionLoading}
                className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all duration-150 active:scale-95 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>MOSTRAR RESULTADOS</span>
              </button>
            )}

            {/* Siguiente pregunta */}
            {room.status === 'QUESTION_RESULTS' && (
              <button
                onClick={() => handleAdvance('NEXT_QUESTION')}
                disabled={actionLoading}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-95 flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4 fill-current" />
                <span>
                  {room.current_question >= TOTAL_QUESTIONS
                    ? 'FINALIZAR PARTIDA'
                    : `SIGUIENTE PREGUNTA (${room.current_question + 1}/${TOTAL_QUESTIONS})`}
                </span>
              </button>
            )}

            {/* Pausar */}
            {room.status === 'QUESTION_ACTIVE' && (
              <button
                onClick={() => handleAdvance('PAUSE')}
                disabled={actionLoading}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
            )}

            {/* Reanudar */}
            {room.status === 'PAUSED' && (
              <button
                onClick={() => handleAdvance('RESUME')}
                disabled={actionLoading}
                className="px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Reanudar Juego</span>
              </button>
            )}
          </div>

          {/* Botón de emergencia: Terminar juego */}
          {room.status !== 'FINISHED' && (
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de que quieres terminar el juego y mostrar los resultados finales?')) {
                  handleAdvance('END_GAME');
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-rose-900/60 text-rose-400 hover:bg-rose-950/60 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Terminar Juego
            </button>
          )}
        </div>

        {/* ============================================================ */}
        {/* CONTENIDO PRINCIPAL: Juego activo / Lobby / Finalizado       */}
        {/* ============================================================ */}
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
            {/* Izquierda: Vista previa de pregunta y tabla de jugadores */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Vista previa de pregunta (si el juego empezó) */}
              {currentQuestion && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="text-xs font-black uppercase text-slate-400 mb-2">
                    VISTA PREVIA DE PREGUNTA (Vista del Host)
                  </div>
                  <QuestionCard
                    question={currentQuestion}
                    currentResult={currentResult}
                    totalQuestions={TOTAL_QUESTIONS}
                  />
                </div>
              )}

              {/* Tabla de jugadores en vivo */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
                      ESTADO DE JUGADORES ({players.length})
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Seguimiento en Vivo
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">Jugador</th>
                        <th className="py-2.5 px-3 text-right">Puntaje</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                        <th className="py-2.5 px-3 text-right">Tiempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            Ningún jugador se ha unido todavía. Comparte el código: <strong>{cleanCode}</strong>
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
                                    <CheckCircle2 className="w-3 h-3" /> RESPONDIDO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    ESPERANDO
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

            {/* Derecha: Orden de respuestas en tiempo real */}
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
