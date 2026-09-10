import Link from 'next/link';
import { 
  Sparkles, 
  CheckCircle, 
  Calendar, 
  BrainCircuit, 
  ShieldCheck, 
  Flame, 
  ArrowRight,
  Layers,
  Layers2,
  Terminal
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Autonomous 5-Stage LLM & Verification Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700">Interview Prep Kits</span> Tailored to Any Job
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10">
              Input any job description and company URL. Our engine crawls company culture, isolates critical skills, synthesizes role-tailored questions, and guarantees 100% coverage with a deterministic study schedule.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/new"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>Generate Prep Kit Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/bulk"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-base transition-all flex items-center justify-center space-x-2"
              >
                <Terminal className="w-4 h-4 text-slate-500" />
                <span>Multi-Role Batch CLI</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">
              Architecture & Features
            </h2>
            <p className="text-3xl font-extrabold text-slate-900">
              Engineered with Zero Hallucination & Deterministic Guarantees
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                SSRF-Safe Company Deep-Dive
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Autonomous scraper with DNS pre-resolution against private/cloud metadata IPs, extracting genuine engineering values and mission statements.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Deterministic Coverage Verifier
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                $O(R+Q)$ bipartite skill coverage algorithm ensuring every single must-have requirement has targeted technical questions.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Reshapeable Kit Builder & Flashcards
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Selectively regenerate individual sections without losing edited or pinned questions. Practice in 3D flashcard mode with spaced repetition.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

