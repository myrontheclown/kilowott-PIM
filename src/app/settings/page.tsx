'use client';

import React, { useState, useEffect } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import {
  Settings,
  Key,
  Globe,
  Lock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Server,
  Activity,
  Shield,
  FileCode,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    providerMode,
    setProviderMode,
    serverConfig,
    refreshServerConfig,
    resetToDemoSeed,
  } = useCatalog();

  // Test form state (for on-the-fly testing without persisting secrets in localStorage)
  const [testStoreUrl, setTestStoreUrl] = useState('');
  const [testConsumerKey, setTestConsumerKey] = useState('');
  const [testConsumerSecret, setTestConsumerSecret] = useState('');

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    storeUrl?: string;
    details?: any;
    error?: string;
  } | null>(null);

  const [isTesting, setIsTesting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync test form with server config URL if available
  useEffect(() => {
    if (serverConfig?.storeUrl && !testStoreUrl) {
      setTestStoreUrl(serverConfig.storeUrl);
    }
  }, [serverConfig, testStoreUrl]);

  // Test server-configured credentials from .env.local
  const handleTestServerConnection = async () => {
    if (isTesting) return; // Prevent duplicate requests
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/woocommerce/test', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.connected) {
        setTestResult({
          success: true,
          message: data.message || 'WooCommerce API connection confirmed active',
          storeUrl: data.storeUrl,
          details: data.details,
        });
        await refreshServerConfig();
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Connection failed',
          storeUrl: data.storeUrl,
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

  // Test custom input credentials
  const handleTestCustomCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTesting) return; // Prevent duplicate requests
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: testStoreUrl.trim(),
          consumerKey: testConsumerKey.trim(),
          consumerSecret: testConsumerSecret.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.connected) {
        setTestResult({
          success: true,
          message: data.message || 'Custom WooCommerce credentials verified successfully',
          storeUrl: data.storeUrl,
          details: data.details,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Connection test failed',
          storeUrl: data.storeUrl,
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
          Manage operational mode, WooCommerce REST credentials, and local catalog state
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{statusMessage}</span>
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
              Uses sample product models with simulated network latency. All push actions are explicitly labeled simulated.
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

      {/* Server Environment Configuration Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Server-Side WooCommerce Configuration
            </h3>
            <p className="text-xs text-slate-500">
              Credentials are loaded securely server-side via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">.env.local</code> and never stored in browser persistence.
            </p>
          </div>
          <Shield className="h-5 w-5 text-indigo-600" />
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Store URL
            </span>
            <div className="font-mono text-xs font-semibold text-slate-900 truncate" title={serverConfig?.storeUrl || 'Not configured'}>
              {serverConfig?.storeUrl || <span className="text-slate-400 font-sans italic">Not configured</span>}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Consumer Key
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {serverConfig?.hasConsumerKey ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="font-mono text-slate-800">{serverConfig.maskedKey || 'Configured'}</span>
                </>
              ) : (
                <span className="text-amber-600">Missing in .env.local</span>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Consumer Secret
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {serverConfig?.hasConsumerSecret ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Configured (Protected)</span>
                </>
              ) : (
                <span className="text-amber-600">Missing in .env.local</span>
              )}
            </div>
          </div>
        </div>

        {/* Test Server Connection Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleTestServerConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-pulse' : ''}`} />
            <span>{isTesting ? 'Testing Link...' : 'Test Configured Connection'}</span>
          </button>

          <button
            type="button"
            onClick={() => refreshServerConfig()}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Test Result Box */}
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
              {testResult.storeUrl && (
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Store: {testResult.storeUrl}
                  {testResult.details?.totalProductsInStore !== undefined &&
                    ` • ${testResult.details.totalProductsInStore} remote products available`}
                </div>
              )}
              {testResult.error && (
                <div className="font-mono text-[11px] text-rose-700 mt-1 bg-white/70 p-2 rounded border border-rose-200">
                  {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LocalWP & .env.local Configuration Guide */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              LocalWP Setup Guide & Environment Variables
            </h3>
            <p className="text-xs text-slate-500">
              Configure credentials in your project root <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-700">.env.local</code> file
            </p>
          </div>
          <FileCode className="h-5 w-5 text-indigo-600" />
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Create or edit <strong><code className="text-slate-800">.env.local</code></strong> in the project root (<code className="text-slate-700">C:\Projects\kilowott\.env.local</code>). This file is ignored by Git to keep credentials secure:
          </p>

          <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg overflow-x-auto select-all">
            <span className="text-slate-500"># LocalWP WooCommerce REST API Credentials</span><br />
            WOOCOMMERCE_STORE_URL=http://your-site.local<br />
            WOOCOMMERCE_CONSUMER_KEY=ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br />
            WOOCOMMERCE_CONSUMER_SECRET=cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX<br />
            NEXT_PUBLIC_DEMO_MODE=false
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                1. Generating WooCommerce API Keys
              </h4>
              <p className="text-[11px] text-slate-600">
                In WordPress admin, go to <strong>WooCommerce &gt; Settings &gt; Advanced &gt; REST API</strong>. Click <strong>Add Key</strong>, set Permissions to <strong>Read/Write</strong>, and generate.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-indigo-600" />
                2. WordPress Permalinks Requirement
              </h4>
              <p className="text-[11px] text-slate-600">
                Ensure Permalinks in <strong>Settings &gt; Permalinks</strong> are set to <strong>Post name</strong> (not &apos;Plain&apos;). WooCommerce REST API endpoints require pretty permalinks.
              </p>
            </div>
          </div>
        </div>
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
            <span>Confirm reset to initial demo dataset?</span>
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
                  setStatusMessage('Catalog reset to initial demo dataset.');
                  setTimeout(() => setStatusMessage(null), 3000);
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
