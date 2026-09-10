'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Pin, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Lightbulb, 
  Sparkles,
  Award,
  Tag
} from 'lucide-react';

export default function QuestionCard({
  question,
  onUpdate,
  onDelete,
  onTogglePin,
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Edit draft state
  const [draft, setDraft] = useState({
    prompt: question.prompt || '',
    category: question.category || 'technical',
    difficulty: question.difficulty || 2,
    answer_outline: question.answer_outline || '',
  });

  const handleSave = () => {
    onUpdate(question.id, {
      ...draft,
      difficulty: Number(draft.difficulty),
      is_edited: true,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft({
      prompt: question.prompt || '',
      category: question.category || 'technical',
      difficulty: question.difficulty || 2,
      answer_outline: question.answer_outline || '',
    });
    setEditing(false);
  };

  const getDifficultyLabel = (diff) => {
    switch (Number(diff)) {
      case 1:
        return { label: 'Easy (L1)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 3:
        return { label: 'Hard (L3)', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 2:
      default:
        return { label: 'Medium (L2)', style: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const diffInfo = getDifficultyLabel(question.difficulty);

  if (editing) {
    return (
      <div className="bg-white rounded-xl border-2 border-sky-400 p-5 shadow-md mb-4 transition-all">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center space-x-1">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editing Question</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                <option value="technical">Technical</option>
                <option value="system-design">System Design</option>
                <option value="behavioural">Behavioural</option>
                <option value="company-fit">Company Fit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-sky-500"
                value={draft.difficulty}
                onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })}
              >
                <option value="1">1 - Easy</option>
                <option value="2">2 - Medium</option>
                <option value="3">3 - Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
            <textarea
              rows={3}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              value={draft.prompt}
              onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ideal Answer & Key Points Outline</label>
            <textarea
              rows={4}
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              value={draft.answer_outline}
              onChange={(e) => setDraft({ ...draft, answer_outline: e.target.value })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`question-${question.id}`}
      className={`bg-white rounded-xl border transition-all mb-3.5 shadow-sm hover:shadow-md scroll-mt-24 ${
        question.is_pinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white uppercase tracking-wider">
                {question.id}
              </span>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${diffInfo.style}`}
              >
                {diffInfo.label}
              </span>

              {question.category && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                  {question.category.replace('-', ' ')}
                </span>
              )}

              {question.requirement_ids?.map((rid) => (
                <span
                  key={rid}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"
                  title={`Linked to Requirement ${rid}`}
                >
                  {rid}
                </span>
              ))}

              {question.is_pinned && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-600" />
                  <span>Pinned</span>
                </span>
              )}

              {question.is_custom && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                  Custom
                </span>
              )}

              {question.is_edited && !question.is_custom && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                  Edited
                </span>
              )}
            </div>

            <p className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug">
              {question.prompt}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onTogglePin(question.id)}
              className={`p-1.5 rounded-lg transition ${
                question.is_pinned
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }`}
              title={question.is_pinned ? 'Unpin question' : 'Pin question (protects from regeneration)'}
            >
              <Pin className={`w-4 h-4 ${question.is_pinned ? 'fill-amber-500' : ''}`} />
            </button>

            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-slate-100 transition"
              title="Edit Question"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(question.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
              title="Delete Question"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition ml-1"
              title={expanded ? 'Collapse' : 'Expand Answer Outline'}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div>
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showAnswer ? 'Hide Sample Solution Outline' : 'Show Sample Solution Outline'}</span>
              </button>

              {showAnswer && (
                <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm leading-relaxed border border-slate-800 whitespace-pre-line font-mono">
                  {question.answer_outline || 'No sample answer outline available.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
