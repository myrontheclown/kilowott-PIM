'use client';

import React from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export function CompletenessChart() {
  const { products } = useCatalog();

  const total = products.length;
  if (total === 0) return null;

  const perfect = products.filter((p) => p.completenessScore === 100).length;
  const moderate = products.filter(
    (p) => p.completenessScore >= 70 && p.completenessScore < 100
  ).length;
  const low = products.filter((p) => p.completenessScore < 70).length;

  const perfectPct = Math.round((perfect / total) * 100);
  const moderatePct = Math.round((moderate / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  const avgScore = Math.round(
    products.reduce((acc, p) => acc + p.completenessScore, 0) / total
  );

  // Group by category to see category health
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryStats = categories.map((cat) => {
    const prods = products.filter((p) => p.category === cat);
    const catAvg = Math.round(
      prods.reduce((acc, p) => acc + p.completenessScore, 0) / (prods.length || 1)
    );
    const completedProds = prods.filter((p) => p.completenessScore === 100).length;
    return {
      category: cat,
      count: prods.length,
      completed: completedProds,
      avg: catAvg,
    };
  });

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Catalog Completeness Health
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time evaluation against category schema validation rules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xl font-bold text-slate-900">{avgScore}%</div>
            <p className="text-[11px] text-slate-500">Average Completeness</p>
          </div>
          <div className="h-10 w-10 rounded-full border-4 border-indigo-600 flex items-center justify-center text-xs font-bold text-indigo-700 bg-indigo-50">
            {avgScore}%
          </div>
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${perfectPct}%` }}
            title={`100% Ready: ${perfect} products (${perfectPct}%)`}
          />
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${moderatePct}%` }}
            title={`Needs minor input: ${moderate} products (${moderatePct}%)`}
          />
          <div
            className="bg-rose-400 transition-all duration-500"
            style={{ width: `${lowPct}%` }}
            title={`Missing critical fields: ${low} products (${lowPct}%)`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Ready for Sync (100%): <strong>{perfect}</strong> ({perfectPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>Moderate (70-99%): <strong>{moderate}</strong> ({moderatePct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span>Incomplete (&lt;70%): <strong>{low}</strong> ({lowPct}%)</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table / Grid */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Completeness By Category
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryStats.map((item) => (
            <div
              key={item.category}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200/60"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800 capitalize truncate">
                  {item.category.replace('-', ' ')}
                </span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {item.avg}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.avg >= 90
                      ? 'bg-emerald-500'
                      : item.avg >= 70
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${item.avg}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span>{item.count} items</span>
                <span>{item.completed} complete</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
