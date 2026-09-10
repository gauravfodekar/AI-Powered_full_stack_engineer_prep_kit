'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Target, BookOpen, Check } from 'lucide-react';

export default function ScheduleView({ schedule, questions = [], onToggleDay }) {
  const daysList = schedule?.days || [];

  if (!daysList || daysList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
        <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-medium">No schedule generated yet.</p>
      </div>
    );
  }

  // Calculate stats
  const totalMinutes = daysList.reduce((sum, d) => sum + (d.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = daysList.filter((d) => !!d.is_completed).length;
  const progressPercent = daysList.length > 0 ? Math.round((completedCount / daysList.length) * 100) : 0;

  // Map of question ID to question object
  const questionMap = new Map((questions || []).map((q) => [q.id, q]));

  return (
    <div className="space-y-6">
      {/* Top Overview & Progress Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Structured Study Timeline</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Balanced {schedule?.days_available || daysList.length}-day preparation plan prioritizing harder topics earlier
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{totalMinutes} mins (~{totalHours} hrs)</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center space-x-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>{daysList.length} Days</span>
            </div>
          </div>
        </div>

        {/* Study Progress Indicator */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                {completedCount} of {daysList.length} Days Completed
              </span>
              {completedCount === daysList.length && (
                <span className="text-xs font-bold text-emerald-600">🎉 All study sessions finished!</span>
              )}
            </span>
            <span className="text-sky-600">{progressPercent}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2.5 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Days Grid / List */}
      <div className="space-y-4">
        {daysList.map((d) => {
          const isCompleted = !!d.is_completed;

          return (
            <div
              key={d.day}
              className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 transition-all hover:border-sky-200 ${
                isCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleDay && onToggleDay(d.day)}
                    className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shadow-sm transition flex-shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                    title={isCompleted ? "Click to mark as incomplete" : "Click to mark day as complete"}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : `D${d.day}`}
                  </button>
                  <div>
                    <h3 className={`font-bold text-base ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      Day {d.day}: {d.focus || 'Technical Preparation'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Focus Area: {d.focus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{d.minutes} mins</span>
                  </span>

                  {/* Explicit Done / Complete Toggle Button */}
                  {onToggleDay && (
                    <button
                      onClick={() => onToggleDay(d.day)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 border ${
                        isCompleted
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title={isCompleted ? "Mark day as incomplete" : "Mark day as completed"}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Scheduled Questions for this Day */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Target Questions ({d.question_ids?.length || 0})
                </p>
                {d.question_ids?.map((qid) => {
                  const q = questionMap.get(qid);
                  return (
                    <div
                      key={qid}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {q ? q.prompt : `Question (${qid})`}
                        </span>
                      </div>

                      {q && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 capitalize">
                          {q.category} (L{q.difficulty})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

