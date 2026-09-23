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
      setError('Por favor ingresa un código de sala válido (ej. ABC123).');
      return;
    }

    if (!cleanNick || cleanNick.length < 2) {
      setError('El apodo debe tener al menos 2 caracteres.');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('La base de datos no está conectada. Por favor agrega tus credenciales de Supabase en .env');
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
        throw new Error('No se pudo unir a la sala. Por favor verifica el código e intenta de nuevo.');
      }

      const joinedPlayer = Array.isArray(data) ? data[0] : data;
      if (!joinedPlayer?.player_id) {
        throw new Error('No se pudo obtener la sesión del jugador desde el servidor.');
      }

      saveSession({
        roomCode: cleanCode,
        playerId: joinedPlayer.player_id,
        nickname: joinedPlayer.nickname,
      });

      sounds.playJoin();
      navigate(`/room/${cleanCode}`);
    } catch (err: unknown) {
      console.error('Error al unirse a la sala:', err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error al intentar unirse a la sala.');
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
        <div className="w-full mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLVER AL INICIO</span>
          </Link>
        </div>

        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              🎮
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              UNIRSE AL DESAFÍO
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa el código de sala y tu apodo para entrar a la arena
            </p>
          </div>

          {hasExistingSession && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-bold block">Sesión Activa Encontrada</span>
                <span className="text-emerald-400/80">
                  Jugador: <strong>{session.nickname}</strong>
                </span>
              </div>
              <button
                onClick={handleRejoinExisting}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors shadow"
              >
                RECONECTAR
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Código de Sala
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="ej. ABC123"
                  maxLength={6}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 font-mono font-black text-base sm:text-lg text-emerald-400 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tu Apodo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="ej. Carlos"
                  maxLength={25}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-700 font-bold text-base text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] mt-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base tracking-wide uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>UNIÉNDOSE A LA SALA...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>ENTRAR A LA SALA</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
