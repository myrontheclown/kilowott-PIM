'use client';

import React from 'react';
import Link from 'next/link';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { CompletenessChart } from '@/components/dashboard/CompletenessChart';
import { RecentSyncActivity } from '@/components/dashboard/RecentSyncActivity';
import { useCatalog } from '@/context/CatalogContext';
import {
  Plus,
  RefreshCw,
  DownloadCloud,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    providerMode,
    products,
    syncAllPending,
    importDummyJson,
    isSyncing,
  } = useCatalog();

  const pendingCount = products.filter(
    (p) => p.syncStatus === 'pending' || p.syncStatus === 'failed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span>CatalogSync PIM</span>
            <span className="text-slate-300">•</span>
            <span>WooCommerce Integration Platform</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Product Information Management Hub
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Centralize product attributes, enforce category-specific validation schemas, calculate real-time completeness scores, and maintain bidirectional synchronization with WooCommerce.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 sm:self-end md:self-center">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>

          <button
            type="button"
            onClick={() => importDummyJson()}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="h-4 w-4 text-slate-500" />
            <span>Import Demo Data</span>
          </button>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => syncAllPending()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Pending ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Clarification Notice */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
          providerMode === 'demo'
            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="mt-0.5">
          {providerMode === 'demo' ? (
            <AlertCircle className="h-4 w-4 text-amber-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            <span>
              {providerMode === 'demo'
                ? 'Demo Mode Active (Simulated Synchronization)'
                : 'WooCommerce Live Mode Active'}
            </span>
          </div>
          <p className="mt-0.5 text-slate-600 leading-normal">
            {providerMode === 'demo' ? (
              <>
                All catalog changes are stored locally in browser persistence. Push operations will be clearly tagged as <strong>Simulated</strong>. You can switch to genuine WooCommerce integration at any time in{' '}
                <Link href="/settings" className="font-semibold underline text-amber-900">
                  Settings
                </Link>
                .
              </>
            ) : (
              <>
                Operations are executed through server-side route handlers against the official WooCommerce REST API v3. Product syncs will only be marked successful if confirmed by the remote store.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <MetricsCards />

      {/* Completeness Health Section */}
      <CompletenessChart />

      {/* Recent Sync Activity Section */}
      <RecentSyncActivity />
    </div>
  );
}
