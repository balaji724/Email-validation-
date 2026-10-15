import React, { useState } from 'react';
import {
  Sliders,
  Shield,
  Download,
  Key,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SettingsProps {
  onClearHistory: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ onClearHistory }) => {
  const [defaultExportFormat, setDefaultExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [treatRoleAsRisky, setTreatRoleAsRisky] = useState(true);
  const [flagFreeWebmail, setFlagFreeWebmail] = useState(false);
  const [dnsTimeoutMs, setDnsTimeoutMs] = useState(2500);
  const [dataRetentionDays, setDataRetentionDays] = useState('30');
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Simulated API Key
  const [apiKey, setApiKey] = useState('ecp_live_894f27a69bc01948d3e');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await onClearHistory();
      setShowClearConfirm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to clear history');
    } finally {
      setClearing(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey = `ecp_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setApiKey(newKey);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Platform Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default spreadsheet export structures, strictness thresholds, automated retention lifecycles, and API automation.
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* 1. Validation Logic & Strictness */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Deliverability Rules & Classification
            </h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={treatRoleAsRisky}
                onChange={(e) => setTreatRoleAsRisky(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Mark Role-Based Addresses as Risky
                </span>
                <p className="text-xs text-slate-500">
                  Flags non-personal team mailboxes (such as info@, support@, sales@, billing@, hello@)
                  to safeguard B2B cold outbound sender score.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flagFreeWebmail}
                onChange={(e) => setFlagFreeWebmail(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Flag Free Consumer Webmail (Gmail, Yahoo, Outlook)
                </span>
                <p className="text-xs text-slate-500">
                  Adds an informational warning when validating lists intended strictly for enterprise corporate prospects.
                </p>
              </div>
            </label>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DNS Authoritative Lookup Timeout
              </label>
              <select
                value={dnsTimeoutMs}
                onChange={(e) => setDnsTimeoutMs(Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value={1500}>1,500 ms (Aggressive speed for bulk jobs)</option>
                <option value={2500}>2,500 ms (Standard recommended balance)</option>
                <option value={5000}>5,000 ms (High tolerance for slow nameservers)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Export & Retention Preferences */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Download className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Export Defaults & Data Retention
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Export File Format
              </label>
              <select
                value={defaultExportFormat}
                onChange={(e) => setDefaultExportFormat(e.target.value as 'csv' | 'xlsx')}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="csv">Standard CSV (.csv) with formula escaping</option>
                <option value="xlsx">Microsoft Excel (.xlsx) workbook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Job Data Auto-Retention Period
              </label>
              <select
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white"
              >
                <option value="7">7 Days (Strict privacy compliance)</option>
                <option value="30">30 Days (Standard SaaS default)</option>
                <option value="90">90 Days (Extended enterprise audit window)</option>
                <option value="0">Zero-Retention (Immediate wipe after export)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. API Key & Automation */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                REST API Integration Key
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active V1
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Use this bearer token to automate single validations or submit bulk files directly from your CRM or CI/CD pipelines.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={apiKey}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-300 rounded-lg text-slate-700"
            />
            <button
              type="button"
              onClick={handleCopyApiKey}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {apiKeyCopied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleGenerateNewKey}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
              title="Roll API Key"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Danger Zone: Clear History */}
      <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-rose-100 text-rose-800">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <h2 className="text-sm font-semibold">
            Danger Zone
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Clear All Validation Job History
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanently purges all bulk spreadsheets, row records, and historical logs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap"
          >
            Purge History
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Purge Entire Validation Ledger?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action is irreversible. All completed jobs, parsed rows, and export links will be destroyed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={clearing}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
              >
                {clearing ? 'Purging...' : 'Yes, Purge Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
