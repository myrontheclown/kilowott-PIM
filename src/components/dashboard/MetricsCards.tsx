'use client';

import React from 'react';
import { useCatalog } from '@/context/CatalogContext';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Sparkles,
  Percent,
} from 'lucide-react';

export function MetricsCards() {
  const { products } = useCatalog();

  const total = products.length;
  const published = products.filter((p) => p.status === 'published').length;
  const incomplete = products.filter((p) => p.completenessScore < 100).length;
  const pendingSync = products.filter((p) => p.syncStatus === 'pending').length;
  const failedSync = products.filter((p) => p.syncStatus === 'failed').length;

  const avgCompleteness =
    total > 0
      ? Math.round(
          products.reduce((acc, p) => acc + p.completenessScore, 0) / total
        )
      : 0;

  const cards = [
    {
      label: 'Total Products',
      value: total,
      subtext: `${published} published in catalog`,
      icon: Package,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Incomplete Data',
      value: incomplete,
      subtext: `${Math.round(((total - incomplete) / (total || 1)) * 100)}% data compliance`,
      icon: AlertTriangle,
      color: incomplete > 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-600 bg-slate-50 border-slate-100',
    },
    {
      label: 'Pending Sync',
      value: pendingSync,
      subtext: 'Awaiting export to WooCommerce',
      icon: Clock,
      color: pendingSync > 0 ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-slate-600 bg-slate-50 border-slate-100',
    },
    {
      label: 'Failed Sync Attempts',
      value: failedSync,
      subtext: failedSync > 0 ? 'Requires attention / retry' : 'All channels healthy',
      icon: XCircle,
      color: failedSync > 0 ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
