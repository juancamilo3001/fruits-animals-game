import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Crown, Trophy, Medal, Timer, CheckCircle, RotateCcw } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { sounds } from '../lib/sounds';

interface PodiumProps {
  leaderboard: LeaderboardEntry[];
  currentPlayerId?: string;
  onPlayAgain?: () => void;
  isHost?: boolean;
}

export const Podium: React.FC<PodiumProps> = ({
  leaderboard,
  currentPlayerId,
  onPlayAgain,
  isHost = false,
}) => {
  useEffect(() => {
    sounds.playFanfare();

    const end = Date.now() + 2.5 * 1000;
    const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center py-6 px-4">
      {/* Título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
          <Trophy className="w-4 h-4" /> RESULTADOS DEL CAMPEONATO
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          RESULTADOS FINALES
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Frutas y Animales — Desafío en Inglés
        </p>
      </div>

      {/* Podio Top 3 */}
      <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 items-end mb-10 max-w-2xl">
        {/* 2.º Lugar */}
        <div className="flex flex-col items-center">
          {second ? (
            <>
              <div className="text-center mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-300 block truncate max-w-[90px] sm:max-w-[140px]">
                  {second.nickname}
                </span>
                <span className="text-xs font-mono font-black text-slate-400">
                  {second.score.toLocaleString()} pts
                </span>
              </div>
              <div className="w-full h-32 sm:h-44 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t-2 border-x-2 border-slate-500/50 flex flex-col items-center justify-start pt-3 shadow-lg">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-300/20 text-slate-200 border-2 border-slate-300 flex items-center justify-center font-black text-base sm:text-xl shadow">
                  2
                </div>
                <Medal className="w-5 h-5 text-slate-300 mt-2" />
              </div>
            </>
          ) : (
            <div className="w-full h-24 bg-slate-900/50 rounded-t-xl" />
          )}
        </div>

        {/* 1.er Lugar */}
        <div className="flex flex-col items-center">
          {first ? (
            <>
              <div className="mb-2 flex flex-col items-center">
                <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                <span className="text-sm sm:text-lg font-black text-amber-300 block truncate max-w-[100px] sm:max-w-[160px]">
                  {first.nickname}
                </span>
                <span className="text-xs sm:text-sm font-mono font-black text-amber-400">
                  {first.score.toLocaleString()} pts
                </span>
              </div>
              <div className="w-full h-44 sm:h-60 bg-gradient-to-t from-amber-950/80 via-amber-900/40 to-amber-700/60 rounded-t-2xl border-t-4 border-x-2 border-amber-400 flex flex-col items-center justify-start pt-4 shadow-2xl ring-2 ring-amber-500/30">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg">
                  1
                </div>
                <Trophy className="w-6 h-6 text-amber-300 mt-3" />
              </div>
            </>
          ) : (
            <div className="w-full h-36 bg-slate-900/50 rounded-t-xl" />
          )}
        </div>

        {/* 3.er Lugar */}
        <div className="flex flex-col items-center">
          {third ? (
            <>
              <div className="text-center mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-300 block truncate max-w-[90px] sm:max-w-[140px]">
                  {third.nickname}
                </span>
                <span className="text-xs font-mono font-black text-amber-600">
                  {third.score.toLocaleString()} pts
                </span>
              </div>
              <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-slate-800 to-amber-950/30 rounded-t-2xl border-t-2 border-x-2 border-amber-700/50 flex flex-col items-center justify-start pt-3 shadow-lg">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-700/30 text-amber-500 border-2 border-amber-700 flex items-center justify-center font-black text-base sm:text-xl shadow">
                  3
                </div>
                <Medal className="w-5 h-5 text-amber-600 mt-2" />
              </div>
            </>
          ) : (
            <div className="w-full h-20 bg-slate-900/50 rounded-t-xl" />
          )}
        </div>
      </div>

      {/* Tabla de clasificación completa */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl mb-8">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
            CLASIFICACIÓN GENERAL
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {leaderboard.length} Jugadores Compitieron
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 sm:px-6">Pos.</th>
                <th className="py-3 px-4 sm:px-6">Jugador</th>
                <th className="py-3 px-4 sm:px-6 text-right">Puntos</th>
                <th className="py-3 px-4 sm:px-6 text-center">Correctas</th>
                <th className="py-3 px-4 sm:px-6 text-right">Tiempo Prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {leaderboard.map((entry) => {
                const isCurrent = entry.player_id === currentPlayerId;
                const avgSec = (Number(entry.avg_response_time_ms) / 1000).toFixed(2);

                return (
                  <tr
                    key={entry.player_id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-emerald-950/40 font-bold text-emerald-300'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-black">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                          entry.player_rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : entry.player_rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : entry.player_rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{entry.player_rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-extrabold flex items-center gap-2">
                      <span>{entry.nickname}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                          TÚ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono font-black text-amber-400">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {entry.correct_answers} / {entry.total_answers}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-mono text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {avgSec}s
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {onPlayAgain && (
        <button
          onClick={onPlayAgain}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base sm:text-lg tracking-wide uppercase shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-95 flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>JUGAR DE NUEVO</span>
        </button>
      )}
    </div>
  );
};
