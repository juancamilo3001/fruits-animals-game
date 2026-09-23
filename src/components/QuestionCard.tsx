import React from 'react';
import { QuestionPublic, QuestionResult } from '../types/game';
import { Apple, Dog } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionPublic;
  currentResult?: QuestionResult | null;
  totalQuestions?: number;
  score?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentResult,
  totalQuestions = 40,
  score,
}) => {
  const formattedNum = String(question.question_number).padStart(2, '0');
  const formattedTotal = String(totalQuestions).padStart(2, '0');
  const isFruits = question.category === 'fruits';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Barra superior: Progreso, Categoría y Puntuación */}
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <span className="text-xs sm:text-sm font-extrabold tracking-widest text-emerald-400 font-mono">
              PREGUNTA {formattedNum} / {formattedTotal}
            </span>
          </div>

          <div
            className={`hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${
              isFruits
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isFruits ? <Apple className="w-3.5 h-3.5" /> : <Dog className="w-3.5 h-3.5" />}
            {isFruits ? 'Frutas' : 'Animales'}
          </div>
        </div>

        {score !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <span className="text-[10px] font-bold uppercase text-slate-400">PUNTOS:</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
              {score.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
          style={{ width: `${(question.question_number / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Tarjeta de la pregunta */}
      <div className="w-full max-w-lg">
        {/* Badge de respuesta correcta cuando se muestran resultados */}
        {currentResult && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500 text-center animate-pulse">
            <span className="text-emerald-300 font-black text-sm sm:text-base">
              ✓ RESPUESTA: {currentResult.correct_answer} — {currentResult.correct_option_text}
            </span>
            <div className="mt-1 text-xs text-slate-400">
              {currentResult.correct_answers} de {currentResult.total_answers} respondieron correctamente
            </div>
          </div>
        )}

        {/* Texto de la pregunta — grande y centrado */}
        <div
          className={`w-full rounded-3xl border-2 p-6 sm:p-8 text-center shadow-2xl ${
            currentResult
              ? 'bg-slate-900/80 border-emerald-500/40'
              : 'bg-slate-900/90 border-slate-700'
          }`}
        >
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {question.question_text}
          </h2>
        </div>
      </div>
    </div>
  );
};
