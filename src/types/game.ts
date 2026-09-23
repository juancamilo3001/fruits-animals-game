export type GameStatus =
  | 'WAITING'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_RESULTS'
  | 'PAUSED'
  | 'FINISHED';

export type QuestionCategory = 'fruits' | 'animals';

export type AnswerOption = 'A' | 'B' | 'C';

export interface QuestionPublic {
  id: string;
  category: QuestionCategory;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
}

export interface QuestionResult {
  question_number: number;
  correct_answer: AnswerOption;
  correct_option_text: string;
  total_answers: number;
  correct_answers: number;
}

export interface Room {
  id: string;
  room_code: string;
  status: GameStatus;
  current_question: number;
  question_started_at: string | null;
  started_at: string | null;
  created_at: string;
  host_token?: string;
}

export interface Player {
  id: string;
  room_id: string;
  nickname: string;
  score: number;
  joined_at: string;
  connected_at: string;
  is_connected: boolean;
}

export interface GameAnswer {
  id: string;
  room_id: string;
  player_id: string;
  question_number: number;
  selected_answer: AnswerOption;
  is_correct: boolean;
  response_time_ms: number;
  points: number;
  answered_at: string;
  nickname?: string;
}

export interface LeaderboardEntry {
  player_rank: number;
  player_id: string;
  nickname: string;
  score: number;
  correct_answers: number;
  total_answers: number;
  avg_response_time_ms: number;
}

export interface AnswerSubmissionResult {
  is_correct: boolean;
  points: number;
  response_time_ms: number;
  correct_answer?: AnswerOption;
}

export interface HostSession {
  roomCode: string;
  hostToken: string;
}

export interface PlayerSession {
  roomCode: string;
  playerId: string;
  nickname: string;
}
