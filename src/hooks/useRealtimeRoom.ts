import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Room, Player, GameAnswer, QuestionPublic, QuestionResult } from '../types/game';
import { sounds } from '../lib/sounds';

export function useRealtimeRoom(roomCode?: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPublic | null>(null);
  const [currentResult, setCurrentResult] = useState<QuestionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isChannelConnected, setIsChannelConnected] = useState<boolean>(false);

  const prevPlayersCountRef = useRef<number>(0);
  const currentQuestionNumRef = useRef<number>(1);
  const roomIdRef = useRef<string | null>(null);

  // 1. Cargar datos iniciales de la sala
  const loadRoomData = useCallback(async (code: string) => {
    if (!isSupabaseConfigured()) {
      setError('Supabase no está configurado. Agrega tus credenciales al archivo .env');
      setLoading(false);
      return;
    }

    try {
      const cleanCode = code.toUpperCase().trim();

      // Obtener datos de la sala
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', cleanCode)
        .single();

      if (roomErr || !roomData) {
        setError(`La sala "${cleanCode}" no fue encontrada.`);
        setLoading(false);
        return;
      }

      setRoom(roomData as Room);
      roomIdRef.current = roomData.id;
      currentQuestionNumRef.current = roomData.current_question;

      // Obtener jugadores
      const { data: playersData, error: playersErr } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('score', { ascending: false });

      if (!playersErr && playersData) {
        setPlayers(playersData as Player[]);
        prevPlayersCountRef.current = playersData.length;
      }

      // Obtener pregunta actual (vista pública, sin respuesta correcta)
      if (roomData.status !== 'WAITING') {
        const { data: qData, error: qErr } = await supabase
          .from('questions_public')
          .select('*')
          .eq('question_number', roomData.current_question)
          .single();

        if (!qErr && qData) {
          setCurrentQuestion(qData as QuestionPublic);
        }

        // Si está en resultados, obtener resultado
        if (roomData.status === 'QUESTION_RESULTS' || roomData.status === 'FINISHED') {
          const { data: resData } = await supabase.rpc('get_question_result', {
            p_room_code: cleanCode,
            p_question_number: roomData.current_question,
          });
          if (resData && resData.length > 0) {
            setCurrentResult(resData[0] as QuestionResult);
          }
        } else {
          setCurrentResult(null);
        }

        // Obtener respuestas de la pregunta actual, ordenadas por response_time_ms
        const { data: ansData } = await supabase
          .from('game_answers')
          .select('*')
          .eq('room_id', roomData.id)
          .eq('question_number', roomData.current_question)
          .order('response_time_ms', { ascending: true });

        if (ansData) {
          setAnswers(ansData as GameAnswer[]);
        }
      } else {
        setCurrentQuestion(null);
        setCurrentResult(null);
        setAnswers([]);
      }

      setError(null);
    } catch (err: unknown) {
      console.error('Error al cargar datos de la sala:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos de la sala');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Canal Realtime
  useEffect(() => {
    if (!roomCode || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const cleanCode = roomCode.toUpperCase().trim();
    loadRoomData(cleanCode);

    const channelName = `game_room_${cleanCode}`;
    const channel = supabase.channel(channelName);

    channel
      // A. Cambios en la sala (estado, pregunta actual, etc.)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        async (payload) => {
          const updated = payload.new as Room;
          if (updated && updated.room_code === cleanCode) {
            setRoom(updated);

            // Si cambió la pregunta o el estado pasó a activo → limpiar respuestas y cargar nueva pregunta
            if (
              updated.current_question !== currentQuestionNumRef.current ||
              updated.status === 'QUESTION_ACTIVE'
            ) {
              currentQuestionNumRef.current = updated.current_question;
              setCurrentResult(null);
              setAnswers([]); // Limpiar respuestas de la pregunta anterior

              // Cargar nueva pregunta
              const { data: qData } = await supabase
                .from('questions_public')
                .select('*')
                .eq('question_number', updated.current_question)
                .single();

              if (qData) {
                setCurrentQuestion(qData as QuestionPublic);
              }

              // Cargar respuestas de la nueva pregunta (normalmente vacío al inicio)
              const { data: ansData } = await supabase
                .from('game_answers')
                .select('*')
                .eq('room_id', updated.id)
                .eq('question_number', updated.current_question)
                .order('response_time_ms', { ascending: true });

              if (ansData) {
                setAnswers(ansData as GameAnswer[]);
              }
            }

            // Si pasó a QUESTION_RESULTS o FINISHED → obtener resultado
            if (updated.status === 'QUESTION_RESULTS' || updated.status === 'FINISHED') {
              const { data: resData } = await supabase.rpc('get_question_result', {
                p_room_code: cleanCode,
                p_question_number: updated.current_question,
              });
              if (resData && resData.length > 0) {
                setCurrentResult(resData[0] as QuestionResult);
              }
            }
          }
        }
      )
      // B. Cambios en jugadores (unirse, actualización de puntaje)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        async (payload) => {
          const currentRoomId = roomIdRef.current;
          if (!currentRoomId) return;

          const newPlayer = payload.new as Player;
          if (newPlayer && newPlayer.room_id === currentRoomId) {
            setPlayers((prev) => {
              const exists = prev.some((p) => p.id === newPlayer.id);
              let updatedList: Player[];
              if (exists) {
                updatedList = prev.map((p) => (p.id === newPlayer.id ? newPlayer : p));
              } else {
                updatedList = [...prev, newPlayer];
                sounds.playJoin();
              }
              return updatedList.sort((a, b) => b.score - a.score);
            });
          }
        }
      )
      // C. Nuevas respuestas en game_answers (Realtime)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_answers',
        },
        (payload) => {
          const newAnswer = payload.new as GameAnswer;
          const currentRoomId = roomIdRef.current;

          if (
            newAnswer &&
            newAnswer.room_id === currentRoomId &&
            newAnswer.question_number === currentQuestionNumRef.current
          ) {
            setAnswers((prev) => {
              // No duplicar
              if (prev.some((a) => a.id === newAnswer.id)) return prev;
              // Insertar y ordenar por response_time_ms (fuente de verdad del servidor)
              return [...prev, newAnswer].sort((a, b) => a.response_time_ms - b.response_time_ms);
            });
            sounds.playTick();
          }
        }
      )
      .subscribe((status) => {
        setIsChannelConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, loadRoomData]);

  // Enriquecer respuestas con nickname del jugador
  const enrichedAnswers = answers.map((ans) => {
    const player = players.find((p) => p.id === ans.player_id);
    return {
      ...ans,
      nickname: player ? player.nickname : 'Jugador desconocido',
    };
  });

  return {
    room,
    players,
    answers: enrichedAnswers,
    currentQuestion,
    currentResult,
    loading,
    error,
    isChannelConnected,
    refreshState: () => {
      if (roomCode) loadRoomData(roomCode);
    },
  };
}
