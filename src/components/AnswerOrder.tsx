import React from 'react';
import { Timer, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { GameAnswer, Player, GameStatus } from '../types/game';

interface AnswerOrderProps {
  answers: GameAnswer[];
  players: Player[];
  currentPlayerId?: string;
  gameStatus: GameStatus;
  className?: string;
}

export const AnswerOrder: React.FC<AnswerOrderProps> = ({
  answers,
  players,
  currentPlayerId,
  gameStatus,
  className = '',
}) => {
  // Ordenar respuestas por response_time_ms ascendente (el más rápido primero)
  const sortedAnswers = [...answers].sort((a, b) => a.response_time_ms - b.response_time_ms);

  // Jugadores que aún no han respondido
  const answeredPlayerIds = new Set(answers.map((a) => a.player_id));
  const waitingPlayers = players.filter((p) => !answeredPlayerIds.has(p.id));

  const isResultsMode = gameStatus === 'QUESTION_RESULTS' || gameStatus === 'FINISHED';

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-xl backdrop-blur-sm ${className}`}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-wider uppercase text-white">
              ORDEN DE RESPUESTA
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {answers.length} de {players.length} respondieron
            </span>
          </div>
        </div>

        {/* Indicador EN VIVO */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          EN VIVO
        </div>
      </div>

      {/* Lista de jugadores que respondieron */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-64 sm:max-h-80 pr-1 custom-scrollbar">
        {sortedAnswers.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Clock className="w-6 h-6 animate-pulse text-slate-600" />
            <span>Esperando la primera respuesta...</span>
          </div>
        ) : (
          sortedAnswers.map((ans, idx) => {
            const isCurrent = ans.player_id === currentPlayerId;
            const timeSec = (ans.response_time_ms / 1000).toFixed(2);

            return (
              <div
                key={ans.id || `${ans.player_id}-${ans.question_number}`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
                }`}
              >
                {/* Izquierda: Posición y Nombre */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : idx === 1
                        ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                        : idx === 2
                        ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <div className="truncate flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold truncate ${
                        isCurrent ? 'text-emerald-300 font-extrabold' : 'text-slate-200'
                      }`}
                    >
                      {isCurrent ? 'TÚ' : ans.nickname}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 uppercase">
                        TÚ
                      </span>
                    )}
                  </div>
                </div>

                {/* Derecha: Tiempo y resultado */}
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {timeSec}s
                  </span>

                  {isResultsMode && (
                    <div className="flex items-center gap-1.5">
                      {ans.is_correct ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          +{ans.points}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          +0
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Jugadores esperando */}
      {waitingPlayers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>ESPERANDO ({waitingPlayers.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {waitingPlayers.map((player) => (
              <span
                key={player.id}
                className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                  player.id === currentPlayerId
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                }`}
              >
                {player.id === currentPlayerId ? 'TÚ' : player.nickname}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
