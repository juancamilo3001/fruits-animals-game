import React from 'react';
import { AnswerOption, QuestionPublic, QuestionResult } from '../types/game';
import { CheckCircle, XCircle } from 'lucide-react';

interface AnswerButtonsProps {
  question: QuestionPublic;
  selectedAnswer: AnswerOption | null;
  onSelectAnswer: (option: AnswerOption) => void;
  disabled: boolean;
  submitting: boolean;
  currentResult?: QuestionResult | null;
}

export const AnswerButtons: React.FC<AnswerButtonsProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled,
  submitting,
  currentResult,
}) => {
  const options: { key: AnswerOption; label: string; text: string }[] = [
    { key: 'A', label: 'A', text: question.option_a },
    { key: 'B', label: 'B', text: question.option_b },
    { key: 'C', label: 'C', text: question.option_c },
  ];

  return (
    <div className="w-full max-w-lg grid grid-cols-1 gap-3 sm:gap-4 my-2">
      {options.map(({ key, label, text }) => {
        const isSelected = selectedAnswer === key;
        const isCorrectResult = currentResult?.correct_answer === key;
        const isWrongResult = currentResult && isSelected && !isCorrectResult;

        let btnStyles =
          'bg-slate-900/90 border-slate-700/80 text-white hover:bg-slate-800 hover:border-emerald-500/50 hover:scale-[1.01]';
        let badgeStyles = 'bg-slate-800 text-slate-300 border-slate-700';

        if (currentResult) {
          if (isCorrectResult) {
            btnStyles =
              'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50 scale-[1.01]';
            badgeStyles = 'bg-emerald-500 text-slate-950 font-black';
          } else if (isWrongResult) {
            btnStyles = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 opacity-90';
            badgeStyles = 'bg-rose-500 text-white font-black';
          } else {
            btnStyles = 'bg-slate-900/40 border-slate-800/80 text-slate-500 opacity-60';
            badgeStyles = 'bg-slate-800 text-slate-600 border-slate-800';
          }
        } else if (isSelected) {
          btnStyles =
            'bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/60';
          badgeStyles = 'bg-emerald-500 text-slate-950 font-black';
        }

        return (
          <button
            key={key}
            onClick={() => onSelectAnswer(key)}
            disabled={disabled || submitting}
            className={`w-full min-h-[64px] sm:min-h-[72px] px-5 py-3 rounded-2xl border-2 transition-all duration-150 flex items-center justify-between gap-4 text-left active:scale-[0.98] disabled:cursor-not-allowed ${btnStyles}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className={`w-10 h-10 rounded-xl text-base font-black flex items-center justify-center border shadow-sm flex-shrink-0 transition-colors ${badgeStyles}`}
              >
                {label}
              </span>
              <span className="text-base sm:text-xl font-extrabold uppercase tracking-wide truncate">
                {text}
              </span>
            </div>

            <div className="flex-shrink-0">
              {currentResult ? (
                isCorrectResult ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : isWrongResult ? (
                  <XCircle className="w-6 h-6 text-rose-400" />
                ) : null
              ) : isSelected ? (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  ENVIADA
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
};
