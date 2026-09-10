'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle, ShieldAlert, Cpu } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Company Deep-Dive', desc: 'SSRF-safe website crawling & culture extraction' },
  { id: 2, label: 'Role & Skill Parsing', desc: 'Must-have vs nice-to-have taxonomy isolation' },
  { id: 3, label: 'Question Bank Synthesis', desc: 'Gemini Flash generation with anti-hallucination guard' },
  { id: 4, label: 'Coverage Gap Verification', desc: 'Deterministic bipartite verification & auto-repair' },
  { id: 5, label: 'Study Schedule Allocation', desc: 'Greedy algorithm & integer minute balancing' },
];

export default function ProgressStepper({ currentStep = 1, isError = false, errorMsg = '' }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto w-full">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">Autonomous Generation Pipeline</h3>
          <p className="text-xs text-slate-500">5-stage synthesis & deterministic verification engine</p>
        </div>
      </div>

      <div className="space-y-4">
        {STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div key={step.id} className="flex items-start space-x-3.5 group">
              <div className="flex-shrink-0 mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 transition-all" />
                ) : isCurrent ? (
                  isError ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                  )
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isCurrent
                        ? isError
                          ? 'text-red-700 font-bold'
                          : 'text-sky-700 font-bold'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && !isError && (
                    <span className="text-[10px] font-semibold tracking-wide bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full uppercase animate-pulse">
                      Processing...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isError && errorMsg && (
        <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-semibold">Pipeline Execution Interrupted</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
}

