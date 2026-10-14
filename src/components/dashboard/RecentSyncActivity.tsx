'use client';

import React from 'react';
import Link from 'next/link';
import { useCatalog } from '@/context/CatalogContext';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';

export function RecentSyncActivity() {
  const { syncLogs, syncSingleProduct, isSyncing } = useCatalog();

  const recentLogs = syncLogs.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Recent Synchronization Activity
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of simulated and remote WooCommerce push events
          </p>
        </div>

        <Link
          href="/sync"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <span>View All in Sync Center</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {recentLogs.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          No synchronization activity recorded yet. Run a sync or import sample data.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => {
            const isSuccess = log.status === 'success';
            const isSimulated = log.status === 'simulated';
            const isFailed = log.status === 'failed';

            return (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isSuccess && (
                      <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    {isSimulated && (
                      <div className="p-1.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                    {isFailed && (
                      <div className="p-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800">
                        {log.productName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {log.sku}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isSimulated
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isSimulated ? 'Simulated' : isSuccess ? 'Live Confirmed' : 'Failed'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{log.message}</p>
                    {log.errorDetails && (
                      <p className="text-[11px] font-mono text-rose-600 bg-rose-50/60 p-1 rounded mt-1">
                        {log.errorDetails}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {isFailed && log.productId !== 'bulk' && (
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => syncSingleProduct(log.productId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
