'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  RefreshCw,
  DownloadCloud,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';

export function Header({ onOpenMobile }: { onOpenMobile: () => void }) {
  const {
    providerMode,
    setProviderMode,
    products,
    syncAllPending,
    importDummyJson,
    isSyncing,
  } = useCatalog();

  const [notification, setNotification] = useState<string | null>(null);

  const pendingCount = products.filter(
    (p) => p.syncStatus === 'pending' || p.syncStatus === 'failed'
  ).length;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSyncPending = async () => {
    const res = await syncAllPending();
    showNotification(`Sync finished: ${res.succeeded} updated, ${res.failed} failed.`);
  };

  const handleImport = async () => {
    const count = await importDummyJson();
    showNotification(`Imported ${count} demo products from DummyJSON.`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile trigger & context title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-600">PIM Engine Online</span>
        </div>
      </div>

      {/* Center Toast notification if active */}
      {notification && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Right: Mode Switcher & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Mode Selector Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setProviderMode('demo')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              providerMode === 'demo'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Demo Mode
          </button>
          <button
            type="button"
            onClick={() => setProviderMode('woocommerce')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              providerMode === 'woocommerce'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            WooCommerce Live
          </button>
        </div>

        {/* Quick Import DummyJSON button */}
        <button
          type="button"
          onClick={handleImport}
          disabled={isSyncing}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
          title="Import sample products from DummyJSON"
        >
          <DownloadCloud className="h-3.5 w-3.5 text-slate-500" />
          <span>Import Sample</span>
        </button>

        {/* Sync Pending Action */}
        <button
          type="button"
          onClick={handleSyncPending}
          disabled={isSyncing || pendingCount === 0}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            pendingCount > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>
            {isSyncing ? 'Syncing...' : `Sync Pending (${pendingCount})`}
          </span>
        </button>
      </div>
    </header>
  );
}
