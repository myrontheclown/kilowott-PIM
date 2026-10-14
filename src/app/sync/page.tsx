'use client';

import React, { useState } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { ConnectionTestResult } from '@/lib/providers/types';
import {
  RefreshCw,
  DownloadCloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
  Activity,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function SyncCenterPage() {
  const {
    providerMode,
    setProviderMode,
    products,
    syncLogs,
    syncSingleProduct,
    syncAllPending,
    importFromCurrentProvider,
    activeProvider,
    isSyncing,
  } = useCatalog();

  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const pendingCount = products.filter((p) => p.syncStatus === 'pending').length;
  const syncedCount = products.filter((p) => p.syncStatus === 'synced').length;
  const simulatedCount = products.filter((p) => p.syncStatus === 'simulated').length;
  const failedCount = products.filter((p) => p.syncStatus === 'failed').length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await activeProvider.testConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    const res = await syncAllPending();
    showNotification(`Batch sync completed: ${res.succeeded} updated, ${res.failed} failed.`);
  };

  const handleImport = async () => {
    try {
      const count = await importFromCurrentProvider();
      showNotification(`Successfully imported ${count} remote products.`);
    } catch (err: any) {
      showNotification(`Import failed: ${err.message}`);
    }
  };

  const filteredLogs = syncLogs.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Synchronization Center</span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                providerMode === 'demo'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {providerMode === 'demo' ? 'Demo Sandbox' : 'WooCommerce REST API'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor connection health, execute master catalog syncs, and inspect audit logs
          </p>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleImport}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="h-4 w-4 text-slate-500" />
            <span>Import Products</span>
          </button>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncing || pendingCount === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              pendingCount > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync All Pending ({pendingCount})</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Connection Status Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                providerMode === 'demo'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {providerMode === 'demo'
                    ? 'Local Sandbox Provider (Simulated Sync)'
                    : 'WooCommerce REST API Provider (Live Channel)'}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    providerMode === 'demo'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {providerMode}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {providerMode === 'demo'
                  ? 'Simulates remote latency and mirror state. Clearly distinguished from genuine network writes.'
                  : 'Communicates with WooCommerce REST API v3 via secure server-side route handlers.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
            >
              <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-pulse text-indigo-600' : ''}`} />
              <span>{isTesting ? 'Testing Link...' : 'Test Connection'}</span>
            </button>

            <Link
              href="/settings"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Configure Credentials
            </Link>
          </div>
        </div>

        {/* Live Test Connection Result Box */}
        {testResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs animate-in fade-in duration-200 flex items-start gap-2.5 ${
              testResult.connected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {testResult.connected ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{testResult.message}</div>
              {testResult.storeName && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Endpoint: {testResult.storeName} • Engine: {testResult.version}
                </div>
              )}
              {testResult.error && (
                <div className="font-mono text-[11px] text-rose-700 mt-1 bg-white/60 p-1.5 rounded">
                  {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting push</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Synced (Live)</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{syncedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Confirmed remote</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Simulated</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{simulatedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Demo sandbox</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{failedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Requires retry</p>
        </div>
      </div>

      {/* Sync Logs Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Synchronization Audit Log
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of push, update, and import events
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'success', 'simulated', 'failed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Message</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isSuccess = log.status === 'success';
                const isSimulated = log.status === 'simulated';
                const isFailed = log.status === 'failed';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.productName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {log.sku}
                        {log.wooCommerceId ? ` • #WC-${log.wooCommerceId}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {log.provider}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isSimulated
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isSuccess && <CheckCircle className="h-3 w-3" />}
                        {isSimulated && <Sparkles className="h-3 w-3" />}
                        {isFailed && <AlertTriangle className="h-3 w-3" />}
                        <span>{isSimulated ? 'Simulated' : isSuccess ? 'Live' : 'Failed'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <div className="text-slate-700 truncate" title={log.message}>
                        {log.message}
                      </div>
                      {log.errorDetails && (
                        <div
                          className="font-mono text-[10px] text-rose-600 truncate mt-0.5"
                          title={log.errorDetails}
                        >
                          {log.errorDetails}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isFailed && log.productId !== 'bulk' && (
                        <button
                          type="button"
                          onClick={() => syncSingleProduct(log.productId)}
                          disabled={isSyncing}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 text-white text-[11px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
