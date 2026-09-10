'use client';

import React from 'react';
import { Building2, Globe, Sparkles, CheckCircle, Tag, Layers, MapPin, Award } from 'lucide-react';

export default function CompanyOverview({ companyBrief, source, role }) {
  if (!companyBrief && !source && !role) return null;

  const mustHaveReqs = role?.requirements?.filter((r) => r.priority === 'must') || [];
  const niceToHaveReqs = role?.requirements?.filter((r) => r.priority === 'nice') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Company Intelligence Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {source?.company || 'Target Company'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                {source?.company_url && (
                  <a
                    href={source.company_url.startsWith('http') ? source.company_url : `https://${source.company_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-sky-600 hover:text-sky-700 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{source.company_url}</span>
                  </a>
                )}
                {source?.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{source.location}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {role?.seniority && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Award className="w-3.5 h-3.5" />
              <span>{role.seniority}</span>
            </span>
          )}
        </div>

        {companyBrief?.summary && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Company Mission & Summary
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {companyBrief.summary}
            </p>
            {companyBrief.sources && companyBrief.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-500">Sources:</span>
                {companyBrief.sources.map((srcUrl, sIdx) => (
                  <a
                    key={sIdx}
                    href={srcUrl.startsWith('http') ? srcUrl : `https://${srcUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline inline-flex items-center space-x-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-100"
                  >
                    <span>{srcUrl.replace(/^https?:\/\//, '')}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {companyBrief?.what_they_do && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Core Business & Value Proposition</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {companyBrief.what_they_do}
            </p>
          </div>
        )}
      </div>

      {/* Role Requirements Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Key Requirements</h3>
              <p className="text-xs text-slate-500">100% verified against synthesized questions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 flex items-center space-x-1 mb-2">
                <Tag className="w-3 h-3" />
                <span>Must-Have Skills ({mustHaveReqs.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {mustHaveReqs.map((req) => (
                  <span
                    key={req.id}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                    title={`Requirement ID: ${req.id}`}
                  >
                    {req.text}
                  </span>
                ))}
              </div>
            </div>

            {niceToHaveReqs.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1 mb-2">
                  <Tag className="w-3 h-3" />
                  <span>Nice-to-Have Skills ({niceToHaveReqs.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {niceToHaveReqs.map((req) => (
                    <span
                      key={req.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                      title={`Requirement ID: ${req.id}`}
                    >
                      {req.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {role?.responsibilities && role.responsibilities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-bold text-slate-700">Core Focus: </span>
            <span>{role.responsibilities[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
