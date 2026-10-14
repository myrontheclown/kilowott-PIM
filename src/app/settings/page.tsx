'use client';

import React, { useState } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { WooCommerceCredentials } from '@/types/product';
import {
  Settings,
  Key,
  Globe,
  Lock,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Server,
  Activity,
  Layers,
  Shield,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    providerMode,
    setProviderMode,
    credentials,
    setCredentials,
    resetToDemoSeed,
  } = useCatalog();

  const [storeUrl, setStoreUrl] = useState(credentials.storeUrl || '');
  const [consumerKey, setConsumerKey] = useState(credentials.consumerKey || '');
  const [consumerSecret, setConsumerSecret] = useState(credentials.consumerSecret || '');

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials({
      storeUrl: storeUrl.trim(),
      consumerKey: consumerKey.trim(),
      consumerSecret: consumerSecret.trim(),
    });
    setSaveMessage('WooCommerce credentials saved successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: storeUrl.trim(),
          consumerKey: consumerKey.trim(),
          consumerSecret: consumerSecret.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.connected) {
        setTestResult({
          success: true,
          message: data.message || 'Successfully connected to WooCommerce store REST API v3',
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Connection failed',
          error: data.error || (data.missingFields ? `Missing: ${data.missingFields.join(', ')}` : undefined),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Network request error',
        error: String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>System Settings & Integrations</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage operational mode, WooCommerce REST credentials, and catalog persistence
        </p>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Operational Mode Selection Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
          Operational Mode
        </h3>
        <p className="text-xs text-slate-500">
          Select between offline sandbox simulation and genuine WooCommerce REST synchronization.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Demo Mode Option */}
          <div
            onClick={() => setProviderMode('demo')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              providerMode === 'demo'
                ? 'border-indigo-600 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-slate-900">Demo Sandbox</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Simulated
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Stores catalog updates in browser persistence and simulates WooCommerce API latency. Sync actions are clearly tagged as simulated.
            </p>
          </div>

          {/* WooCommerce Live Option */}
          <div
            onClick={() => setProviderMode('woocommerce')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              providerMode === 'woocommerce'
                ? 'border-indigo-600 bg-indigo-50/20'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-slate-900">WooCommerce Live API</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                REST v3
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connects server-side to genuine WooCommerce REST endpoints. Requires valid Store URL, Consumer Key, and Consumer Secret.
            </p>
          </div>
        </div>
      </div>

      {/* WooCommerce REST API Credentials Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              WooCommerce REST API v3 Credentials
            </h3>
            <p className="text-xs text-slate-500">
              Credentials are kept server-side and never exposed to public client bundles
            </p>
          </div>
          <Shield className="h-5 w-5 text-indigo-600" />
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store URL
            </label>
            <div className="relative">
              <Globe className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://example-store.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Root domain of your WordPress WooCommerce installation (with https://)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumer Key (Read / Write)
            </label>
            <div className="relative">
              <Key className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder="ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumer Secret
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder="cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
            >
              <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-pulse text-indigo-600' : ''}`} />
              <span>{isTesting ? 'Testing Link...' : 'Test Remote Connection'}</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Credentials</span>
            </button>
          </div>
        </form>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{testResult.message}</div>
              {testResult.error && (
                <div className="font-mono text-[11px] text-rose-700 mt-1 bg-white/60 p-1.5 rounded">
                  {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reset Catalog Data */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Reset Demo Sandbox Catalog
        </h3>
        <p className="text-xs text-slate-500">
          Restores initial seed catalog (Clothing, Electronics, Home Goods, Beauty) with varied completeness scores and initial synchronization logs.
        </p>

        {showResetConfirm ? (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
            <span>Confirm reset to initial hackathon demo state?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-white rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoSeed();
                  setShowResetConfirm(false);
                  setSaveMessage('Catalog reset to initial demo dataset.');
                  setTimeout(() => setSaveMessage(null), 3000);
                }}
                className="px-3 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>
    </div>
  );
}
