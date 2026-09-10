'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  PlusCircle, 
  Search, 
  Building2, 
  Calendar, 
  Layers, 
  Play, 
  Trash2, 
  ExternalLink,
  BookOpen,
  Loader2,
  Sparkles,
  Flame
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchKits();
    }
  }, [user, authLoading]);

  const fetchKits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/kits');
      setKits(res.data.kits || []);
    } catch (err) {
      setError('Failed to load preparation kits.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKit = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title || 'this kit'}"?`)) return;

    try {
      await api.delete(`/kits/${id}`);
      setKits(kits.filter((k) => (k._id || k.id) !== id));
    } catch (err) {
      alert('Failed to delete kit');
    }
  };

  const filteredKits = kits.filter((kit) => {
    const q = search.toLowerCase();
    const role = (kit.role?.title || kit.title || '').toLowerCase();
    const company = (kit.source?.company || kit.company || '').toLowerCase();
    return role.includes(q) || company.includes(q);
  });

  const totalQuestions = kits.reduce(
    (sum, k) => sum + (k.questions?.length || 0),
    0
  );

  if (authLoading || (loading && kits.length === 0)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading your interview dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interview Prep Kits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personalized preparation kits, practice questions, and study schedules.
          </p>
        </div>

        <Link
          href="/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-500/20 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Kit</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kits</p>
            <p className="text-2xl font-extrabold text-slate-900">{kits.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Questions</p>
            <p className="text-2xl font-extrabold text-slate-900">{totalQuestions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coverage Engine</p>
            <p className="text-2xl font-extrabold text-slate-900">100% Deterministic</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center space-x-3">
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by role or company name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Kits List */}
      {filteredKits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {search ? 'No matching prep kits found' : 'No interview prep kits yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {search
              ? 'Try changing your search query.'
              : 'Generate your first tailored kit from any job description & company URL.'}
          </p>
          <Link
            href="/new"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 text-white font-bold text-sm rounded-xl hover:bg-sky-700 shadow-md shadow-sky-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Generate First Prep Kit</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKits.map((kit) => {
            const kitId = kit._id || kit.id;
            const role = kit.role?.title || kit.title || 'Target Role';
            const company = kit.source?.company || kit.company || 'Target Company';
            const qCount = kit.questions?.length || 0;
            const daysCount = kit.schedule?.days_available || kit.schedule?.days?.length || 5;

            return (
              <div
                key={kitId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[140px]">{company}</span>
                    </span>

                    <button
                      onClick={() => handleDeleteKit(kitId, role)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Delete Kit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug">
                    {role}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {kit.company_brief?.summary || 'Role interview preparation kit.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-4 border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                      <span>{qCount} Questions</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{daysCount} Days Plan</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/kit/${kitId}`}
                    className="flex-grow py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold text-center transition flex items-center justify-center space-x-1"
                  >
                    <span>View & Edit Kit</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    href={`/kit/${kitId}/practice`}
                    className="py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm shadow-sky-500/20"
                    title="Start Flashcard Practice Mode"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Practice</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
