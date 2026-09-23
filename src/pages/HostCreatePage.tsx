import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, PlusCircle, ArrowLeft, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useHostSession } from '../hooks/useHostSession';

export const HostCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, saveHostSession } = useHostSession();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!isSupabaseConfigured()) {
      setError('La base de datos no está conectada. Por favor agrega tus credenciales de Supabase en .env');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('create_game_room');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('No se pudo crear la sala. Por favor intenta de nuevo.');
      }

      const newRoom = Array.isArray(data) ? data[0] : data;
      const roomCode = newRoom?.room_code;
      const hostToken = newRoom?.host_token;

      if (!roomCode || !hostToken) {
        throw new Error('La sala fue creada pero no se pudieron obtener las credenciales.');
      }

      saveHostSession({
        roomCode,
        hostToken,
      });

      navigate(`/host/${roomCode}`);
    } catch (err: unknown) {
      console.error('Error al crear sala:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la sala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-md mx-auto w-full">
        <div className="w-full mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLVER AL INICIO</span>
          </Link>
        </div>

        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center">
          {/* Ícono del Host */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <Shield className="w-8 h-8 fill-current" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mb-2">
            CREAR PARTIDA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mb-6">
            Crea una sala oficial, muestra las preguntas en vivo y controla el flujo de la competición.
          </p>

          {/* Sesión activa — reconectar */}
          {session && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border border-amber-500/30 text-left">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Sesión Activa de Host
              </span>
              <p className="text-sm text-slate-200 mb-3">
                Creaste anteriormente la Sala <strong>{session.roomCode}</strong>.
              </p>
              <Link
                to={`/host/${session.roomCode}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow"
              >
                <Play className="w-4 h-4 fill-current" />
                Volver al Panel ({session.roomCode})
              </Link>
            </div>
          )}

          {/* Banner de error */}
          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón Crear */}
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full min-h-[56px] px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base uppercase tracking-wide shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>GENERANDO SALA...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>CREAR NUEVA SALA</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
};
