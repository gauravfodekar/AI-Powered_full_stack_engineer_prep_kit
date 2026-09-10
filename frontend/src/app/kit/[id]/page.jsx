'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import CompanyOverview from '../../../components/CompanyOverview';
import QuestionCard from '../../../components/QuestionCard';
import ScheduleView from '../../../components/ScheduleView';
import { 
  Play, 
  RotateCw, 
  PlusCircle, 
  Download, 
  Printer, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  FileDown
} from 'lucide-react';

const CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'system-design', label: 'System Design' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'company-fit', label: 'Company Fit' },
];

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regeneratingCat, setRegeneratingCat] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'schedule' | 'coverage'
  const [collapsedSections, setCollapsedSections] = useState({});
  const [error, setError] = useState('');

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const collapseAll = () => {
    const all = {};
    CATEGORIES.forEach((c) => {
      all[c.key] = true;
    });
    setCollapsedSections(all);
  };

  const expandAll = () => {
    setCollapsedSections({});
  };
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    category: 'technical',
    difficulty: 2,
    prompt: '',
    answer_outline: '',
    requirement_ids: [],
  });

  useEffect(() => {
    if (kitId) {
      fetchKit();
    }
  }, [kitId]);

  const fetchKit = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/kits/${kitId}`);
      setKit(res.data.kit || res.data);
    } catch (err) {
      setError('Failed to load prep kit. It may not exist or requires login.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (qId, updatedFields) => {
    const updatedQuestions = (kit.questions || []).map((q) =>
      q.id === qId ? { ...q, ...updatedFields } : q
    );
    const updatedKit = { ...kit, questions: updatedQuestions };
    setKit(updatedKit);
    await autoSave(updatedKit);
  };

  const handleDeleteQuestion = async (qId) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    const updatedQuestions = (kit.questions || []).map((q) =>
      q.id === qId ? null : q
    ).filter(Boolean);
    const updatedKit = { ...kit, questions: updatedQuestions };
    setKit(updatedKit);
    await autoSave(updatedKit);
  };

  const handleTogglePin = async (qId) => {
    const updatedQuestions = (kit.questions || []).map((q) =>
      q.id === qId ? { ...q, is_pinned: !q.is_pinned } : q
    );
    const updatedKit = { ...kit, questions: updatedQuestions };
    setKit(updatedKit);
    await autoSave(updatedKit);
  };

  const handleToggleDay = async (dayNum) => {
    if (!kit?.schedule?.days) return;
    const updatedDays = kit.schedule.days.map((d) =>
      d.day === dayNum ? { ...d, is_completed: !d.is_completed } : d
    );
    const updatedKit = {
      ...kit,
      schedule: {
        ...kit.schedule,
        days: updatedDays,
      },
    };
    setKit(updatedKit);
    await autoSave(updatedKit);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const createdQ = {
      id: `custom-q-${Date.now()}`,
      category: newQuestion.category,
      difficulty: Number(newQuestion.difficulty),
      prompt: newQuestion.prompt,
      answer_outline: newQuestion.answer_outline || 'Structured response with architectural trade-offs.',
      requirement_ids: newQuestion.requirement_ids.length > 0 ? newQuestion.requirement_ids : ['r1'],
      is_custom: true,
      is_pinned: true,
    };

    const updatedQuestions = [...(kit.questions || []), createdQ];
    const updatedKit = { ...kit, questions: updatedQuestions };
    setKit(updatedKit);
    setShowAddModal(false);
    setNewQuestion({
      category: 'technical',
      difficulty: 2,
      prompt: '',
      answer_outline: '',
      requirement_ids: [],
    });
    await autoSave(updatedKit);
  };

  const handleRegenerateCategory = async (sectionKey, sectionLabel) => {
    if (
      !confirm(
        `Regenerate "${sectionLabel}" questions? Any pinned or custom questions will be preserved, while unedited AI questions will be refreshed.`
      )
    ) {
      return;
    }

    try {
      setRegeneratingCat(sectionKey);
      const res = await api.post(`/kits/${kitId}/regenerate`, {
        section: sectionKey,
      });
      setKit(res.data.kit || res.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to regenerate category';
      alert(msg);
    } finally {
      setRegeneratingCat(null);
    }
  };

  const autoSave = async (kitToSave) => {
    try {
      setSaving(true);
      await api.put(`/kits/${kitId}`, kitToSave);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const exportMarkdown = () => {
    if (!kit) return;
    const role = kit.role?.title || 'Target Role';
    const company = kit.source?.company || 'Target Company';

    let md = `# Interview Preparation Kit: ${role} @ ${company}\n\n`;
    md += `**Company Summary:** ${kit.company_brief?.summary || 'N/A'}\n\n`;
    md += `## Must-Have Requirements\n`;
    kit.role?.requirements
      ?.filter((r) => r.priority === 'must')
      .forEach((r) => {
        md += `- [${r.id}] ${r.text}\n`;
      });
    md += `\n## Question Bank (${kit.questions?.length || 0} Questions)\n\n`;

    kit.questions?.forEach((q, idx) => {
      md += `### ${idx + 1}. [L${q.difficulty}] ${q.prompt}\n`;
      md += `**Category:** ${q.category}\n`;
      md += `**Linked Requirements:** ${q.requirement_ids.join(', ')}\n\n`;
      if (q.answer_outline) {
        md += `**Ideal Answer Outline:**\n\`\`\`\n${q.answer_outline}\n\`\`\`\n\n`;
      }
      md += `---\n\n`;
    });

    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${role.replace(/\s+/g, '_')}_Interview_Kit.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(kit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${kit.role?.title || 'kit'}_AppendixA.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading interview kit...</p>
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Unable to load preparation kit</h2>
        <p className="text-xs text-slate-500">{error || 'Kit not found'}</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scrollToQuestion = (qId) => {
    setActiveTab('questions');
    const targetQ = (kit?.questions || []).find((q) => q.id === qId);
    if (targetQ && targetQ.category) {
      setCollapsedSections((prev) => ({ ...prev, [targetQ.category]: false }));
    }
    setTimeout(() => {
      const el = document.getElementById(`question-${qId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-sky-400', 'transition-all');
        setTimeout(() => el.classList.remove('ring-4', 'ring-sky-400'), 2500);
      }
    }, 150);
  };

  const role = kit.role?.title || 'Target Role';
  const company = kit.source?.company || 'Target Company';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/dashboard" className="hover:text-sky-600">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-bold">{company}</span>
          </div>

          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {role}
            </h1>
            {saveSuccess && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-in fade-in">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            {saving && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/kit/${kitId}/practice`}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition flex items-center space-x-1.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Practice Flashcards</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Add Question</span>
          </button>

          <button
            onClick={exportMarkdown}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Download Markdown Cheat Sheet"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <button
            onClick={exportJson}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Export Appendix A JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Print / PDF One-Pager"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Company Intelligence and Role Metadata Component */}
      <CompanyOverview
        companyBrief={kit.company_brief}
        source={kit.source}
        role={kit.role}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 mb-8 no-print">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'questions'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Bank ({kit.questions?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'schedule'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Study Schedule ({kit.schedule?.days?.length || 0} Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('coverage')}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === 'coverage'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Coverage & Deterministic Verification</span>
        </button>
      </div>

      {/* TAB CONTENT 1: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="space-y-8">
          {/* Quick Toolbar for Minimizing / Expanding All */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500 no-print">
            <span className="font-semibold">Categorized Question Bank</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1 transition"
                title="Minimize all categories"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
                <span>Minimize All</span>
              </button>
              <button
                onClick={expandAll}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center space-x-1 transition"
                title="Expand all categories"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
                <span>Expand All</span>
              </button>
            </div>
          </div>

          {CATEGORIES.map(({ key, label }) => {
            const categoryQuestions =
              (kit.questions || []).filter((q) => q.category === key);
            const isRegenerating = regeneratingCat === key;
            const isCollapsed = !!collapsedSections[key];

            return (
              <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div
                    onClick={() => toggleSection(key)}
                    className="flex items-center space-x-3 cursor-pointer group select-none flex-grow"
                  >
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-600 transition"
                      title={isCollapsed ? "Expand section" : "Minimize section"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                    <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition">
                      {label}
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {categoryQuestions.length}
                    </span>
                    {isCollapsed && (
                      <span className="text-xs text-slate-400 font-medium italic">
                        (minimized &bull; click to expand)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRegenerateCategory(key, label)}
                      disabled={isRegenerating}
                      className="no-print self-start sm:self-auto inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition border border-sky-200/60"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>{isRegenerating ? 'Synthesizing...' : 'Regenerate Section'}</span>
                    </button>
                  </div>
                </div>

                {/* Questions List (Rendered when expanded) */}
                {!isCollapsed && (
                  <div>
                    {categoryQuestions.length === 0 ? (
                      <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                        No questions in this section yet. Click &quot;Regenerate Section&quot; or hand-add a question.
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {categoryQuestions.map((q) => (
                          <QuestionCard
                            key={q.id}
                            question={q}
                            onUpdate={handleUpdateQuestion}
                            onDelete={handleDeleteQuestion}
                            onTogglePin={handleTogglePin}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT 2: STUDY SCHEDULE */}
      {activeTab === 'schedule' && (
        <ScheduleView
          schedule={kit.schedule}
          questions={kit.questions}
          onToggleDay={handleToggleDay}
        />
      )}

      {/* TAB CONTENT 3: COVERAGE VERIFICATION */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Deterministic Coverage Verification</h3>
                <p className="text-xs text-slate-500">
                  Guaranteeing 100% test alignment between JD skills and synthesized questions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Extracted Requirements Matrix
                </h4>
                {kit.role?.requirements?.map((req) => {
                  const matchingQuestions = (kit.questions || []).filter((q) =>
                    q.requirement_ids?.includes(req.id)
                  );

                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 uppercase ${
                              req.priority === 'must'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {req.id} ({req.priority})
                          </span>
                          <span className="text-xs font-bold text-slate-800">{req.text}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                          {matchingQuestions.length} Qs
                        </span>
                      </div>

                      {matchingQuestions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                          <span className="text-[10px] text-slate-400 font-semibold">Mapped Questions:</span>
                          {matchingQuestions.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => scrollToQuestion(q.id)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 transition flex items-center space-x-0.5"
                              title={`Jump to ${q.id}: ${q.prompt?.slice(0, 50)}...`}
                            >
                              <span>{q.id}</span>
                              <span className="text-[9px]">↗</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  Verification Report
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>Total Execution Passes:</strong> {kit.coverage?.passes || 1}</p>
                  <p>
                    <strong>Uncovered Requirement IDs:</strong>{' '}
                    {kit.coverage?.uncovered_requirement_ids?.length === 0 ? (
                      <span className="text-emerald-400 font-bold">None (100% Fully Covered)</span>
                    ) : (
                      kit.coverage?.uncovered_requirement_ids?.join(', ')
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Custom Question</h3>
            <p className="text-xs text-slate-500 mb-4">
              Hand-add targeted questions. Custom questions are automatically pinned and preserved across section regenerations.
            </p>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500"
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  >
                    <option value="1">1 - Easy</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Question Prompt
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the interview question scenario and technical constraints..."
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={newQuestion.prompt}
                  onChange={(e) => setNewQuestion({ ...newQuestion, prompt: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ideal Answer Outline & Talking Points
                </label>
                <textarea
                  rows={3}
                  placeholder="Key architecture concepts, trade-offs, and design considerations..."
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={newQuestion.answer_outline}
                  onChange={(e) => setNewQuestion({ ...newQuestion, answer_outline: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
