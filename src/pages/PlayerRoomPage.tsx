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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);

  // Check if player has answered the current question
  const currentAnswer = answers.find(
    (a) => a.player_id === session?.playerId && a.question_number === room?.current_question
  );

  // Reset answer states when room advances question
  useEffect(() => {
    if (room?.status === 'QUESTION_ACTIVE') {
      if (!currentAnswer) {
        setSelectedAnswer(null);
        setSubmissionFeedback(null);
      }
    }
  }, [room?.current_question, room?.status, currentAnswer]);

  // If player already answered before reconnect/refresh, restore state
  useEffect(() => {
    if (currentAnswer) {
      setSelectedAnswer(currentAnswer.selected_answer);
      setSubmissionFeedback({
        is_correct: currentAnswer.is_correct,
        points: currentAnswer.points,
        response_time_ms: currentAnswer.response_time_ms,
      });
    }
  }, [currentAnswer]);

  // Fetch final leaderboard if game FINISHED
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
          console.error('Error fetching leaderboard:', err);
        } finally {
          setLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [room?.status, cleanCode]);

  // Handle Answer Selection
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
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Leave Room
  const handleLeave = () => {
    clearSession();
    navigate('/');
  };

  // If no session found, redirect to join
  if (!session || session.roomCode.toUpperCase() !== cleanCode) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Join to Play
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              You must enter your nickname before entering Room {cleanCode}.
            </p>
            <Link
              to={`/join?room=${cleanCode}`}
              className="w-full inline-block py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors"
            >
              Enter Nickname
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading Room
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar roomCode={cleanCode} isConnected={isChannelConnected} onLeave={handleLeave} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
          <p className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Connecting to Arena...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar onLeave={handleLeave} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-black text-white uppercase mb-2">
              Room Not Available
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {error || 'This room does not exist or has already been closed.'}
            </p>
            <button
              onClick={handleLeave}
              className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-wider transition-colors"
            >
              Return Home
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
        {/* ================================================================= */}
        {/* 1. LOBBY WAITING STATE                                             */}
        {/* ================================================================= */}
        {room.status === 'WAITING' && (
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center py-6 sm:py-10">
            {/* Header info */}
            <div className="text-center mb-6">
              <span className="text-xs font-black tracking-widest text-emerald-400 uppercase block mb-1">
                FRUITS & ANIMALS
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                ENGLISH CHALLENGE
              </h1>
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                <span className="text-xs text-slate-400 font-bold">ROOM:</span>
                <span className="text-lg font-black text-emerald-400 tracking-wider">
                  {cleanCode}
                </span>
              </div>
            </div>

            {/* Waiting box */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm sm:text-base text-white uppercase tracking-wider">
                    PLAYERS CONNECTED: {players.length}
                  </span>
                </div>
                <StatusBadge status="WAITING" />
              </div>

              {/* Player Nicknames Grid */}
              <div className="mb-8">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Players:
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
                            YOU
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waiting status message */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
                <span className="text-sm font-bold text-amber-200">
                  Waiting for the host to start the game...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. QUESTION ACTIVE & RESULTS STATES                              */}
        {/* ================================================================= */}
        {(room.status === 'QUESTION_ACTIVE' || room.status === 'QUESTION_RESULTS') && (
          <div className="w-full flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 max-w-6xl">
            {/* Left Column: Question Card & Large Answer Buttons */}
            <div className="w-full lg:flex-1 flex flex-col items-center">
              {currentQuestion ? (
                <>
                  <QuestionCard
                    question={currentQuestion}
                    currentResult={currentResult}
                    totalQuestions={30}
                    score={currentPlayer?.score}
                  />

                  {/* Immediate feedback banner after submitting */}
                  {submissionFeedback && !currentResult && (
                    <div className="w-full max-w-lg mb-3 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs sm:text-sm font-bold text-emerald-300">
                        Answer submitted in{' '}
                        <strong>
                          {(submissionFeedback.response_time_ms / 1000).toFixed(2)}s
                        </strong>
                        ! Waiting for others...
                      </span>
                    </div>
                  )}

                  {/* Results banner when question ends */}
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
                            CORRECT! +{submissionFeedback.points} POINTS
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                          <span className="text-sm font-extrabold">
                            INCORRECT! +0 POINTS
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* The 3 Large Responsive Buttons */}
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
                  <p className="text-sm font-bold text-slate-400">Loading Question...</p>
                </div>
              )}
            </div>

            {/* Right Column: Live ANSWER ORDER */}
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

        {/* ================================================================= */}
        {/* 3. PAUSED STATE                                                   */}
        {/* ================================================================= */}
        {room.status === 'PAUSED' && (
          <div className="w-full max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
            <PauseCircle className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-black text-white uppercase mb-2">
              GAME PAUSED
            </h2>
            <p className="text-sm text-slate-400">
              The host has temporarily paused the game. It will resume shortly.
            </p>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. FINISHED STATE (Final Podium & Leaderboard)                     */}
        {/* ================================================================= */}
        {room.status === 'FINISHED' && (
          <div className="w-full">
            {loadingLeaderboard ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
                <p className="text-base font-bold text-slate-300 uppercase tracking-wider">
                  Computing Final Championship Standings...
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
