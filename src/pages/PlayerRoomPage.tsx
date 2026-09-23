import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Timer,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  PauseCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerButtons } from '../components/AnswerButtons';
import { AnswerOrder } from '../components/AnswerOrder';
import { Podium } from '../components/Podium';
import { useRealtimeRoom } from '../hooks/useRealtimeRoom';
import { usePlayerSession } from '../hooks/usePlayerSession';
import { supabase } from '../lib/supabase';
import { AnswerOption, LeaderboardEntry } from '../types/game';
import { sounds } from '../lib/sounds';

const TOTAL_QUESTIONS = 40;

export const PlayerRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const cleanCode = (roomCode || '').toUpperCase().trim();

  const { session, clearSession } = usePlayerSession();
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

  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    is_correct: boolean;
    points: number;
    response_time_ms: number;
  } | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Verificar si el jugador ya respondió la pregunta actual
  const currentAnswer = answers.find(
    (a) => a.player_id === session?.playerId && a.question_number === room?.current_question
  );

  // Resetear estado al avanzar de pregunta
  useEffect(() => {
    if (room?.status === 'QUESTION_ACTIVE') {
      if (!currentAnswer) {
        setSelectedAnswer(null);
        setSubmissionFeedback(null);
        setSubmissionError(null);
      }
    }
  }, [room?.current_question, room?.status, currentAnswer]);

  // Si ya respondió antes de reconectar, restaurar estado
  useEffect(() => {
    if (currentAnswer) {
      setSelectedAnswer(currentAnswer.selected_answer);
      setSubmissionFeedback({
        is_correct: currentAnswer.is_correct,
        points: currentAnswer.points,
        response_time_ms: currentAnswer.response_time_ms,
      });
      setSubmissionError(null);
    }
  }, [currentAnswer]);

  // Obtener leaderboard final si el juego terminó
  useEffect(() => {
    if (room?.status === 'FINISHED') {
      const fetchLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
          const { data } = await supabase.rpc('get_room_leaderboard', {
            p_room_code: cleanCode,
          });
          if (data) {
            setLeaderboard(data as LeaderboardEntry[]);
          }
        } catch (err) {
          console.error('Error al obtener el leaderboard:', err);
        } finally {
          setLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [room?.status, cleanCode]);

  // Seleccionar y enviar respuesta
  const handleSelectAnswer = async (option: AnswerOption) => {
    if (
      !session ||
      !room ||
      room.status !== 'QUESTION_ACTIVE' ||
      selectedAnswer !== null ||
      submitting
    ) {
      return;
    }

    setSelectedAnswer(option);
    setSubmitting(true);
    setSubmissionError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('submit_player_answer', {
        p_room_code: cleanCode,
        p_player_id: session.playerId,
        p_question_number: room.current_question,
        p_selected_answer: option,
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (data && data.length > 0) {
        const res = data[0];
        setSubmissionFeedback(res);
        if (res.is_correct) {
          sounds.playCorrect();
        } else {
          sounds.playIncorrect();
        }
      }
    } catch (err: unknown) {
      console.error('Error al enviar respuesta:', err);
      setSubmissionError(err instanceof Error ? err.message : 'Error desconocido al enviar respuesta.');
      setSelectedAnswer(null); // Permitir que el jugador vuelva a intentar
    } finally {
      setSubmitting(false);
    }
  };

  // Salir de la sala
  const handleLeave = () => {
    clearSession();
    navigate('/');
  };

  // Sin sesión → redirigir a unirse
  if (!session || session.roomCode.toUpperCase() !== cleanCode) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Únete para Jugar
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Debes ingresar tu apodo antes de entrar a la Sala {cleanCode}.
            </p>
            <Link
              to={`/join?room=${cleanCode}`}
              className="w-full inline-block py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Ingresar Apodo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cargando sala
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar roomCode={cleanCode} isConnected={isChannelConnected} onLeave={handleLeave} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Conectando a la Sala...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar onLeave={handleLeave} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Sala No Disponible
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {error || 'Esta sala no existe o ya fue cerrada.'}
            </p>
            <button
              onClick={handleLeave}
              className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-wider transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players.find((p) => p.id === session.playerId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar
        roomCode={cleanCode}
        isConnected={isChannelConnected}
        onLeave={handleLeave}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col items-center">
        {/* ============================================================ */}
        {/* 1. SALA DE ESPERA (LOBBY)                                    */}
        {/* ============================================================ */}
        {room.status === 'WAITING' && (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-6 sm:py-10">
            <div className="text-center mb-6">
              <span className="text-xs font-black tracking-widest text-emerald-400 uppercase block mb-1">
                FRUTAS Y ANIMALES
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                DESAFÍO EN INGLÉS
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400 font-bold">SALA:</span>
                <span className="text-lg font-black text-emerald-400 tracking-wider">
                  {cleanCode}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
                    JUGADORES CONECTADOS: {players.length}
                  </span>
                </div>
                <StatusBadge status="WAITING" />
              </div>

              <div className="mb-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Jugadores:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {players.map((p) => {
                    const isSelf = p.id === session.playerId;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-extrabold truncate ${
                          isSelf
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                        <span className="truncate">{p.nickname}</span>
                        {isSelf && (
                          <span className="ml-auto text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 uppercase">
                            TÚ
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
                <span className="text-sm font-bold text-amber-200">
                  Esperando que el host inicie la partida...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 2. PREGUNTA ACTIVA Y RESULTADOS                              */}
        {/* ============================================================ */}
        {(room.status === 'QUESTION_ACTIVE' || room.status === 'QUESTION_RESULTS') && (
          <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-6xl">
            {/* Columna izquierda: Tarjeta de pregunta y botones */}
            <div className="w-full lg:flex-1 flex flex-col items-center">
              {currentQuestion ? (
                <>
                  <QuestionCard
                    question={currentQuestion}
                    currentResult={currentResult}
                    totalQuestions={TOTAL_QUESTIONS}
                    score={currentPlayer?.score}
                  />

                  {/* Feedback inmediato al enviar */}
                  {submissionFeedback && !currentResult && (
                    <div className="w-full max-w-lg mb-3 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-bold text-emerald-300">
                        ¡Respuesta enviada en{' '}
                        <strong>
                          {(submissionFeedback.response_time_ms / 1000).toFixed(2)}s
                        </strong>
                        ! Esperando a los demás...
                      </span>
                    </div>
                  )}

                  {/* Banner de resultado cuando termina la pregunta */}
                  {currentResult && submissionFeedback && (
                    <div
                      className={`w-full max-w-lg mb-3 p-3.5 rounded-2xl border text-center flex items-center justify-center gap-2.5 ${
                        submissionFeedback.is_correct
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'bg-rose-950/70 border-rose-500 text-rose-200 ring-2 ring-rose-500/40'
                      }`}
                    >
                      {submissionFeedback.is_correct ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-extrabold">
                            ¡CORRECTO! +{submissionFeedback.points} PUNTOS
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                          <span className="text-sm font-extrabold">
                            ¡INCORRECTO! +0 PUNTOS
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Mostrar errores del RPC al jugador */}
                  {submissionError && (
                    <div className="w-full max-w-lg mb-3 p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-center flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-rose-300">
                        {submissionError}
                      </span>
                    </div>
                  )}

                  {/* Los 3 botones de respuesta */}
                  <AnswerButtons
                    question={currentQuestion}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={handleSelectAnswer}
                    disabled={selectedAnswer !== null || room.status !== 'QUESTION_ACTIVE'}
                    submitting={submitting}
                    currentResult={currentResult}
                  />
                </>
              ) : (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">Cargando Pregunta...</p>
                </div>
              )}
            </div>

            {/* Columna derecha: Orden de respuestas */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <AnswerOrder
                answers={answers}
                players={players}
                currentPlayerId={session.playerId}
                gameStatus={room.status}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. JUEGO PAUSADO                                             */}
        {/* ============================================================ */}
        {room.status === 'PAUSED' && (
          <div className="w-full max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <PauseCircle className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-black text-white uppercase mb-2">
              JUEGO PAUSADO
            </h2>
            <p className="text-sm text-slate-400">
              El host ha pausado temporalmente el juego. Reanudará pronto.
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* 4. FINALIZADO — Podio y Clasificación                        */}
        {/* ============================================================ */}
        {room.status === 'FINISHED' && (
          <div className="w-full">
            {loadingLeaderboard ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
                <p className="text-base font-bold text-slate-300 uppercase tracking-wider">
                  Calculando Resultados Finales...
                </p>
              </div>
            ) : (
              <Podium
                leaderboard={leaderboard}
                currentPlayerId={session.playerId}
                onPlayAgain={handleLeave}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
