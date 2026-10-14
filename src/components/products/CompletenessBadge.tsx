'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CompletenessBadgeProps {
  score: number;
  missingFields?: string[];
  showDetails?: boolean;
}

export function CompletenessBadge({
  score,
  missingFields = [],
  showDetails = true,
}: CompletenessBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const isComplete = score === 100;
  const isModerate = score >= 70 && score < 100;

  const colorClass = isComplete
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isModerate
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';

  const barColor = isComplete
    ? 'bg-emerald-500'
    : isModerate
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-help ${colorClass}`}
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span>{score}%</span>
        {isComplete ? (
          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        )}
      </div>

      {/* Tooltip showing missing fields */}
      {showTooltip && showDetails && missingFields.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-lg bg-slate-900 text-white text-[11px] leading-tight shadow-xl z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="font-semibold text-slate-200 mb-1 border-b border-slate-700 pb-1 flex items-center justify-between">
            <span>Missing Attributes</span>
            <span className="text-rose-400 font-mono text-[10px]">
              {missingFields.length} remaining
            </span>
          </div>
          <ul className="space-y-1 text-slate-300">
            {missingFields.map((field, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-rose-400" />
                <span>{field}</span>
              </li>
            ))}
          </ul>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
