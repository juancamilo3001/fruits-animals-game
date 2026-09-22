import React, { useState } from 'react';
import { QuestionPublic, QuestionResult } from '../types/game';
import { Apple, Dog, Image as ImageIcon } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionPublic;
  currentResult?: QuestionResult | null;
  totalQuestions?: number;
  score?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentResult,
  totalQuestions = 30,
  score,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formattedNum = String(question.question_number).padStart(2, '0');
  const formattedTotal = String(totalQuestions).padStart(2, '0');
  const isFruits = question.category === 'fruits';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Banner: Question Progress & Category & Current Score */}
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <span className="text-xs sm:text-sm font-extrabold tracking-widest text-emerald-400 font-mono">
              QUESTION {formattedNum} / {formattedTotal}
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
            {question.category}
          </div>
        </div>

        {score !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 shadow-inner">
            <span className="text-[10px] font-bold uppercase text-slate-400">SCORE:</span>
            <span className="text-xs sm:text-sm font-black text-amber-400 font-mono">
              {score.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar (0 to 100%) */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
          style={{ width: `${(question.question_number / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Large Featured Image Frame */}
      <div className="w-full max-w-lg aspect-[4/3] sm:aspect-[16/10] bg-slate-900/90 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex items-center justify-center group">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 animate-pulse text-slate-500">
            <ImageIcon className="w-10 h-10 animate-bounce" />
            <span className="text-xs font-semibold">Loading question image...</span>
          </div>
        )}

        {imgError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-medium">Image unavailable</p>
          </div>
        ) : (
          <img
            src={question.image_url}
            alt="English Challenge Item"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover sm:object-contain transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          />
        )}

        {/* Revealed overlay badge if in results */}
        {currentResult && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-bounce-short">
            <span>ANSWER: {currentResult.correct_answer} ({currentResult.correct_option_text})</span>
          </div>
        )}
      </div>

      {/* Question Prompt Text */}
      <h2 className="text-lg sm:text-2xl font-black text-white text-center mt-4 mb-2 tracking-tight">
        {question.question_text}
      </h2>
    </div>
  );
};
