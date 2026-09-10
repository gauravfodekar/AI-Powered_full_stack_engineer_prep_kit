'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import ProgressStepper from '../../components/ProgressStepper';
import { 
  Sparkles, 
  Globe, 
  FileText, 
  Calendar, 
  ArrowRight, 
  Zap, 
  Info,
  ShieldCheck 
} from 'lucide-react';

const SAMPLE_JD = `Senior Backend Engineer (Node.js & Distributed Systems)
We are seeking a Senior Backend Engineer to build resilient distributed payment and telemetry microservices.
Requirements:
- 5+ years building backend services in Node.js / TypeScript / Go.
- Strong proficiency in PostgreSQL, MongoDB, Redis caching, and Kafka message streaming.
- Deep understanding of distributed transactions, idempotency keys, rate limiting algorithms (Token Bucket/Leaky Bucket), and gRPC.
- Hands-on experience with Docker, Kubernetes, and AWS infrastructure.
- Experience conducting code reviews, mentoring junior engineers, and driving system architecture RFCs.`;

export default function NewKitPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [companyUrl, setCompanyUrl] = useState('https://stripe.com');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [prepDays, setPrepDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  const fillSample = () => {
    setCompanyUrl('https://stripe.com');
    setJobDescription(SAMPLE_JD);
    setTargetRole('Senior Backend Engineer');
    setPrepDays(7);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description or click "Fill Sample JD".');
      return;
    }

    setError('');
    setLoading(true);
    setCurrentStep(1);

    // Simulate animated step progression for UI responsiveness while backend processes
    const timer1 = setTimeout(() => setCurrentStep(2), 2500);
    const timer2 = setTimeout(() => setCurrentStep(3), 6000);
    const timer3 = setTimeout(() => setCurrentStep(4), 12000);
    const timer4 = setTimeout(() => setCurrentStep(5), 18000);

    try {
      const res = await api.post('/kits', {
        company_url: companyUrl.trim(),
        jd: jobDescription.trim(),
        title: targetRole.trim() || undefined,
        days: Number(prepDays),
      });

      setCurrentStep(6);
      const kitId = res.data.kit?._id;
      if (kitId) {
        router.push(`/kit/${kitId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      let userMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;

      if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
        userMsg = 'Kit generation timed out. Multi-page web crawling and Gemini AI generation took longer than the configured client timeout. Please retry in a few moments.';
      }

      setError(
        userMsg || 'Kit generation failed. Ensure your backend server is running and GEMINI_API_KEY is configured in .env.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Gemini Flash + Deterministic Guard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Personalized Interview Prep Kit
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Paste any job description and company link to build a custom question bank with 100% skill coverage and a structured timeline.
        </p>
      </div>

      {loading ? (
        <div className="py-8">
          <ProgressStepper currentStep={currentStep} isError={!!error} errorMsg={error} />
          <p className="text-center text-xs text-slate-400 mt-4 animate-pulse">
            Analyzing architecture, verifying skill coverage, and balancing study timeline...
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Target Role & Company Parameters</span>
            </span>

            <button
              type="button"
              onClick={fillSample}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fill Sample JD</span>
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company URL / Website</span>
                </label>
                <input
                  type="text"
                  placeholder="https://company.com or company domain"
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  CRAWLS culture, engineering blog, and company values (SSRF protected).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Role (Optional Override)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full text-sm border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Auto-extracted from job description if left blank.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Job Description (JD) Content</span>
                </span>
                <span className="text-slate-400 font-normal lowercase">Required</span>
              </label>
              <textarea
                rows={8}
                required
                placeholder="Paste the complete job description text, responsibilities, requirements, and tech stack here..."
                className="w-full text-sm border border-slate-300 rounded-2xl p-4 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Preparation Timeline Slider */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Preparation Duration:</span>
                  <span className="text-sky-700 text-sm font-black ml-1">{prepDays} Days</span>
                </label>
                <span className="text-xs text-slate-500">1 to 30 days</span>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                step="1"
                className="w-full accent-sky-600 cursor-pointer"
                value={prepDays}
                onChange={(e) => setPrepDays(Number(e.target.value))}
              />

              <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
                <span>1 Day (Crash Course)</span>
                <span>7 Days (Recommended)</span>
                <span>14 Days</span>
                <span>30 Days (Deep Mastery)</span>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-base shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Generate Interview Kit</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

