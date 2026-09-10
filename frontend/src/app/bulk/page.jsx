'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { 
  FileSpreadsheet, 
  Upload, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download, 
  ExternalLink,
  Code,
  Sparkles
} from 'lucide-react';

const SAMPLE_BATCH = [
  {
    "id": "case-01-stripe",
    "company_url": "https://stripe.com",
    "job_description": "Senior Backend Engineer. Build resilient payment APIs in Node.js, distributed transactions, Redis, Kafka, and PostgreSQL.",
    "prep_days": 7
  },
  {
    "id": "case-02-airbnb",
    "company_url": "https://airbnb.com",
    "job_description": "Frontend Architect. Build high performance web applications with Next.js, React, Tailwind CSS, accessibility, and SSR.",
    "prep_days": 5
  },
  {
    "id": "case-03-figma",
    "company_url": "https://figma.com",
    "job_description": "Full Stack Engineer. WebAssembly, Canvas rendering, real-time collaboration with WebSockets, CRDTs, and TypeScript.",
    "prep_days": 10
  }
];

export default function BulkImportPage() {
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_BATCH, null, 2));
  const [cases, setCases] = useState(SAMPLE_BATCH);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        setCases(parsed);
        setError('');
      } else {
        setError('JSON must be an array of test cases.');
      }
    } catch (err) {
      setError('Invalid JSON syntax.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setJsonText(content);
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setCases(parsed);
            setError('');
          }
        } catch {
          setError('Uploaded file is not valid JSON array.');
        }
      }
    };
    reader.readAsText(file);
  };

  const runBatch = async () => {
    if (!cases || cases.length === 0) {
      setError('Please provide at least one case.');
      return;
    }

    setLoading(true);
    setError('');
    const batchResults = [];
    setProgress({ current: 0, total: cases.length });

    for (let i = 0; i < cases.length; i++) {
      const testCase = cases[i];
      try {
        const res = await api.post('/kits', {
          company_url: testCase.company_url,
          jd: testCase.job_description || testCase.jd,
          title: testCase.target_role || testCase.title,
          days: testCase.prep_days || testCase.days || 7,
        });

        const createdKit = res.data.kit;
        batchResults.push({
          id: testCase.id || `case-${i + 1}`,
          role: createdKit?.role?.title || testCase.target_role || 'Candidate',
          company: createdKit?.source?.company || testCase.company_url,
          kitId: createdKit?._id || createdKit?.id,
          status: 'success',
          kit: createdKit,
        });
      } catch (err) {
        let errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message;
        if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
          errorMsg = 'Request timed out. Please retry.';
        }
        batchResults.push({
          id: testCase.id || `case-${i + 1}`,
          role: testCase.target_role || 'Target Role',
          company: testCase.company_url,
          status: 'error',
          error: errorMsg,
        });
      }
      setProgress({ current: i + 1, total: cases.length });
    }

    setResults(batchResults);
    setLoading(false);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results.map(r => r.kit || r), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'generated_kits_batch.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Multi-Role Batch Evaluation UI</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Bulk Interview Kit Generator
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Generate multiple interview preparation kits simultaneously with rate limiting and per-case error isolation.
          </p>
        </div>

        {results.length > 0 && (
          <button
            onClick={downloadJson}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export Appendix B JSON</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Editor Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Code className="w-4 h-4 text-sky-600" />
                <span>Test Cases (JSON Format)</span>
              </span>

              <label className="cursor-pointer text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1 bg-sky-50 px-3 py-1 rounded-lg">
                <Upload className="w-3 h-3" />
                <span>Upload JSON</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <textarea
              rows={14}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-900 text-emerald-400"
              value={jsonText}
              onChange={handleJsonChange}
            />

            {error && (
              <p className="text-xs text-rose-600 mt-2 font-semibold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {cases.length} case{cases.length !== 1 ? 's' : ''} loaded
            </span>

            <button
              onClick={runBatch}
              disabled={loading || !!error || cases.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing ({progress.current}/{progress.total})...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Batch Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Stream / Progress */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 pb-3 mb-3 border-b border-slate-100 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Batch Execution Stream</span>
            </h2>

            {loading && (
              <div className="mb-4 bg-sky-50 border border-sky-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-bold text-sky-800 mb-2">
                  <span>Batch Generation in Progress</span>
                  <span>{Math.round((progress.current / (progress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-sky-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(progress.current / (progress.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {results.length === 0 && !loading ? (
              <div className="text-center py-16 text-slate-400">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="text-xs font-medium">Click &quot;Execute Batch Run&quot; to synthesize kits.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      res.status === 'success'
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                        : 'bg-rose-50/40 border-rose-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {res.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold">{res.id}</span>
                        <span className="text-xs text-slate-500">• {res.role}</span>
                      </div>

                      {res.status === 'success' && res.kitId && (
                        <Link
                          href={`/kit/${res.kitId}`}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center space-x-1"
                        >
                          <span>Open Kit</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {res.error && (
                      <p className="text-[11px] text-rose-600 mt-1 pl-6">{res.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
            CLI Alternative: <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">npm run evaluate -- --input data/sample_cases.json</code>
          </div>
        </div>
      </div>
    </div>
  );
}

