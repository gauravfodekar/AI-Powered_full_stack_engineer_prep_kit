'use client';

import React, { useState } from 'react';
import { RotateCw, CheckCircle2, AlertCircle, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

export default function Flashcard({ question, onRate, currentIndex, totalCards }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleRate = (rating) => {
    setFlipped(false);
    onRate(question.id, rating);
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress & Category Top Bar */}
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
        <span>Card {currentIndex + 1} of {totalCards}</span>
        <span className="text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
          {question.category || 'Interview Question'}
        </span>
      </div>

      {/* Card Container */}
      <div 
        onClick={handleFlip}
        className="cursor-pointer min-h-[360px] sm:min-h-[400px] w-full bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-sky-300 relative group overflow-hidden"
      >
        {/* Flip Hint Icon */}
        <div className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition">
          <RotateCw className="w-4 h-4" />
        </div>

        {!flipped ? (
          /* FRONT OF CARD (Question) */
          <div className="flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getDifficultyBadge(
                    question.difficulty
                  )}`}
                >
                  {question.difficulty || 'Medium'}
                </span>
                {question.is_pinned && (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {question.title || question.question}
              </h2>

              {question.title && question.title !== question.question && (
                <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
                  {question.question}
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Click card to reveal answer & rubric</span>
              </span>
              <span className="font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
                Flip &rarr;
              </span>
            </div>
          </div>
        ) : (
          /* BACK OF CARD (Answer & Rubric) */
          <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
            <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ideal Answer Outline</span>
                </h3>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono whitespace-pre-line leading-relaxed">
                  {question.sample_answer_outline || 'Focus on structural clarity, edge cases, trade-offs, and company culture alignment.'}
                </div>
              </div>

              {question.evaluation_rubric && question.evaluation_rubric.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Evaluation Criteria</span>
                  </h3>
                  <ul className="space-y-1 text-xs text-slate-700 pl-1">
                    {(Array.isArray(question.evaluation_rubric)
                      ? question.evaluation_rubric
                      : [question.evaluation_rubric]
                    ).map((r, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Click card to flip back</span>
              <span className="font-semibold text-slate-600">Rate your recall below &darr;</span>
            </div>
          </div>
        )}
      </div>

      {/* Confidence Rating Buttons */}
      <div className="mt-6 flex items-center justify-center space-x-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate('hard');
          }}
          className="flex-1 py-3 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
        >
          <span>🔴 Hard</span>
          <span className="text-[10px] text-rose-500 hidden sm:inline">(Repeat Soon)</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate('medium');
          }}
          className="flex-1 py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
        >
          <span>🟡 Good</span>
          <span className="text-[10px] text-amber-600 hidden sm:inline">(Needs Review)</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRate('easy');
          }}
          className="flex-1 py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
        >
          <span>🟢 Mastered</span>
          <span className="text-[10px] text-emerald-600 hidden sm:inline">(Confident)</span>
        </button>
      </div>
    </div>
  );
}

