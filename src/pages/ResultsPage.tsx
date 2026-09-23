import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Podium } from '../components/Podium';
import { supabase } from '../lib/supabase';
import { LeaderboardEntry } from '../types/game';

export const ResultsPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const cleanCode = (roomCode || '').toUpperCase().trim();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data, error: rpcErr } = await supabase.rpc('get_room_leaderboard', {
          p_room_code: cleanCode,
        });

        if (rpcErr) throw new Error(rpcErr.message);

        if (data) {
          setLeaderboard(data as LeaderboardEntry[]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar los resultados');
      } finally {
        setLoading(false);
      }
    };

    if (cleanCode) {
      fetchResults();
    }
  }, [cleanCode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar roomCode={cleanCode} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col items-center">
        <div className="w-full mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>INICIO</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Cargando Clasificación...
            </p>
          </div>
        ) : error || leaderboard.length === 0 ? (
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl my-12">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Sin Resultados
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {error || `No se encontraron datos de la Sala ${cleanCode}.`}
            </p>
            <Link
              to="/join"
              className="w-full inline-block py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Jugar una Partida
            </Link>
          </div>
        ) : (
          <Podium leaderboard={leaderboard} />
        )}
      </main>
    </div>
  );
};
