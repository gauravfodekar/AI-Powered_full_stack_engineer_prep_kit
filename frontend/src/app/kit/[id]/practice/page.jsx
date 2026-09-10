'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import api from '../../../../lib/api';
import { 
  ArrowLeft, 
  RotateCcw, 
  Trophy, 
  RotateCw, 
  HelpCircle,
  Sparkles, 
  CheckCircle2, 
  Loader2,
  BookOpen
} from 'lucide-react';

export default function PracticeModePage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [initialCount, setInitialCount] = useState(0);
  const [masteredIds, setMasteredIds] = useState(new Set());
  const [stats, setStats] = useState({ mastered: 0, reviews: 0 });

  useEffect(() => {
    if (kitId) {
      fetchKit();
    }
  }, [kitId]);

  const fetchKit = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/kits/${kitId}`);
      const fetchedKit = res.data.kit || res.data;
      setKit(fetchedKit);

      // Build cards list from kit.flashcards (or fallback to kit.questions)
      let initialCards = [];
      if (fetchedKit?.flashcards?.length > 0) {
        initialCards = fetchedKit.flashcards.map((f) => ({
          id: f.id,
          front: f.front,
          back: f.back,
          requirement_ids: f.requirement_ids,
        }));
      } else if (fetchedKit?.questions?.length > 0) {
        initialCards = fetchedKit.questions.map((q) => ({
          id: q.id,
          front: q.prompt,
          back: q.answer_outline,
          requirement_ids: q.requirement_ids,
        }));
      }

      setQueue(initialCards);
      setInitialCount(initialCards.length);
      setMasteredIds(new Set());
    } catch (err) {
      console.error('Failed to load kit for practice', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateCard = (rating) => {
    setFlipped(false);
    const currentCard = queue[currentIndex];

    if (rating === 'easy') {
      // Mastered card
      const newMastered = new Set(masteredIds).add(currentCard.id);
      setMasteredIds(newMastered);
      setStats((prev) => ({ ...prev, mastered: newMastered.size }));

      if (currentIndex + 1 >= queue.length) {
        triggerCelebration();
        setCompleted(true);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    } else if (rating === 'medium') {
      // Re-insert 3 positions later for spaced reinforcement
      setStats((prev) => ({ ...prev, reviews: prev.reviews + 1 }));
      const newQueue = [...queue];
      const insertAt = Math.min(currentIndex + 3, newQueue.length);
      newQueue.splice(insertAt, 0, currentCard);
      setQueue(newQueue);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Hard: Re-insert 2 positions later for immediate recall test
      setStats((prev) => ({ ...prev, reviews: prev.reviews + 1 }));
      const newQueue = [...queue];
      const insertAt = Math.min(currentIndex + 2, newQueue.length);
      newQueue.splice(insertAt, 0, currentCard);
      setQueue(newQueue);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const restartSession = () => {
    fetchKit();
    setCurrentIndex(0);
    setFlipped(false);
    setCompleted(false);
    setStats({ mastered: 0, reviews: 0 });
    setMasteredIds(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing flashcard session...</p>
      </div>
    );
  }

  if (!kit || queue.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">No cards available to practice</h2>
        <Link
          href={`/kit/${kitId}`}
          className="inline-block px-5 py-2.5 bg-sky-600 text-white font-bold text-xs rounded-xl"
        >
          Return to Kit Builder
        </Link>
      </div>
    );
  }

  const role = kit.role?.title || 'Target Role';
  const currentCard = queue[currentIndex];
  const uniqueMastered = masteredIds.size;
  const progressPercent = initialCount > 0 ? Math.round((uniqueMastered / initialCount) * 100) : 0;
  const remainingInQueue = Math.max(0, queue.length - currentIndex);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <Link
          href={`/kit/${kitId}`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-sky-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Kit</span>
        </Link>

        <div className="text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Interactive Flashcards
          </span>
          <h1 className="text-sm sm:text-base font-extrabold text-slate-800 truncate max-w-xs sm:max-w-md">
            {role}
          </h1>
        </div>

        <button
          onClick={restartSession}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          title="Restart Session"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Spaced Repetition Progress Bar */}
      <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
              {uniqueMastered} of {initialCount} Concepts Mastered
            </span>
            <span className="text-slate-400 text-[11px] font-normal hidden sm:inline">
              (Turn #{currentIndex + 1} &bull; {remainingInQueue} cards left in active queue)
            </span>
          </span>
          <span className="text-sky-600">{progressPercent}% Mastered</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2.5 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard View or Celebration Screen */}
      {!completed && currentCard ? (
        <div className="w-full max-w-2xl mx-auto">
          {/* Card Box */}
          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer min-h-[360px] sm:min-h-[400px] w-full bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-sky-300 relative group"
          >
            <div className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition">
              <RotateCw className="w-4 h-4" />
            </div>

            {!flipped ? (
              /* FRONT OF CARD */
              <div className="flex flex-col justify-between h-full space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider">
                      Question / Concept
                    </span>
                    {currentCard.requirement_ids?.map((rid) => (
                      <span
                        key={rid}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                      >
                        {rid}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {currentCard.front}
                  </h2>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Click card to reveal ideal solution outline</span>
                  </span>
                  <span className="font-semibold text-sky-600 group-hover:translate-x-1 transition-transform">
                    Reveal &rarr;
                  </span>
                </div>
              </div>
            ) : (
              /* BACK OF CARD */
              <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-200">
                <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ideal Answer & Technical Points</span>
                    </h3>
                    <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono whitespace-pre-line leading-relaxed">
                      {currentCard.back}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Click card to flip back</span>
                  <span className="font-semibold text-sky-600">Rate your recall below to move to next card &darr;</span>
                </div>
              </div>
            )}
          </div>

          {/* Confidence Rating Buttons with Action Guidance */}
          <div className="mt-6 space-y-2">
            <p className="text-center text-xs font-semibold text-slate-500">
              How confident are you with this concept? Rate below to advance:
            </p>

            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => handleRateCard('hard')}
                className="flex-1 py-3 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
                title="Mark as difficult to review again soon in this session"
              >
                <span>🔴 Hard</span>
                <span className="text-[10px] text-rose-500 hidden sm:inline">(Repeat Soon)</span>
              </button>

              <button
                onClick={() => handleRateCard('medium')}
                className="flex-1 py-3 px-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
                title="Mark as familiar to review once more later"
              >
                <span>🟡 Good</span>
                <span className="text-[10px] text-amber-600 hidden sm:inline">(Review Later)</span>
              </button>

              <button
                onClick={() => handleRateCard('easy')}
                className="flex-1 py-3 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm transition shadow-sm flex items-center justify-center space-x-1.5"
                title="Mark as mastered and complete this concept"
              >
                <span>🟢 Mastered</span>
                <span className="text-[10px] text-emerald-600 hidden sm:inline">(Confident)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completion Celebration Screen */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Session Completed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              You&apos;ve actively practiced all flashcards in this interview prep kit.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase">Total Practice Turns</p>
              <p className="text-xl font-black text-slate-800 mt-1">{queue.length}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold uppercase">Unique Concepts Mastered</p>
              <p className="text-xl font-black text-emerald-600 mt-1">{initialCount}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={restartSession}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again</span>
            </button>

            <Link
              href={`/kit/${kitId}`}
              className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition flex items-center justify-center space-x-2"
            >
              <span>Back to Kit Builder</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
