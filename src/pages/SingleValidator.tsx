import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  RotateCcw,
  Copy,
  Check,
  Server,
  Globe,
  Mail,
  Shield,
  Layers,
  Info,
} from 'lucide-react';
import { SingleValidationResult } from '../types';
import { StatusBadge, ScoreBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface SingleValidatorProps {
  onValidated?: () => void;
}

export const SingleValidator: React.FC<SingleValidatorProps> = ({ onValidated }) => {
  const [emailInput, setEmailInput] = useState('');
  const [treatRoleAsRisky, setTreatRoleAsRisky] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SingleValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewRawJson, setViewRawJson] = useState(false);

  const presets = [
    { label: 'Corporate Mailbox', email: 'contact@microsoft.com' },
    { label: 'Free Webmail', email: 'alex.developer@gmail.com' },
    { label: 'Disposable / Burner', email: 'temp.user1029@mailinator.com' },
    { label: 'Role-Based Address', email: 'billing@stripe.com' },
    { label: 'Non-Existent Domain', email: 'john@fake-domain-not-registered-404.com' },
    { label: 'Syntax Error', email: 'bad..syntax@missing-tld' },
  ];

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.validateSingle(emailInput.trim(), treatRoleAsRisky);
      setResult(res);
      if (onValidated) onValidated();
    } catch (err: any) {
      setError(err.message || 'Validation request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmailInput('');
    setResult(null);
    setError(null);
  };

  const handleCopyResult = () => {
    if (!result) return;
    const summary = `Email: ${result.normalizedEmail}
Status: ${result.status}
Score: ${result.score}/100
Comment: ${result.comment}
MX Records: ${result.checks.dns.mxRecords.join(', ') || 'None'}
Disposable: ${result.checks.disposable.isDisposable ? 'Yes' : 'No'}
Role-Based: ${result.checks.roleBased.isRoleBased ? 'Yes' : 'No'}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Single Email Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Perform multi-layer deliverability analysis: RFC 5322 syntax, DNS mail-exchanger (MX) routing,
          disposable email blacklist, and role account checks.
        </p>
      </div>

      {/* Main Validation Input Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4">
        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address to Test
            </label>
            <div className="relative">
              <input
                id="email"
                type="text"
                placeholder="e.g. sarah.connor@cyberdyne.org"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-4 pr-12 py-3 text-base bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400 font-mono"
              />
              {emailInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Quick Test:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setEmailInput(preset.email);
                  // validate directly
                  setTimeout(() => {
                    api.validateSingle(preset.email, treatRoleAsRisky).then((r) => {
                      setResult(r);
                      if (onValidated) onValidated();
                    });
                  }, 50);
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Advanced toggle & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={treatRoleAsRisky}
                onChange={(e) => setTreatRoleAsRisky(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Classify role-based accounts (info@, sales@, etc.) as Risky</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading || !emailInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-2xs min-w-[130px]"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving DNS...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Validate Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Validation Results Display */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden space-y-6 p-6">
          {/* Summary Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3">
                <StatusBadge status={result.status} size="md" />
                <ScoreBadge score={result.score} />
              </div>
              <h2 className="text-xl font-bold font-mono text-slate-900 mt-2 break-all">
                {result.normalizedEmail}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {result.comment}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyResult}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Result'}</span>
              </button>
              <button
                onClick={() => setViewRawJson(!viewRawJson)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{viewRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
              </button>
            </div>
          </div>

          {/* Raw JSON View */}
          {viewRawJson && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {/* Multi-Layer Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Syntax Check */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>RFC 5322 Syntax Check</span>
                </div>
                {result.checks.syntax.valid ? (
                  <span className="text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Passed
                  </span>
                ) : (
                  <span className="text-rose-700 text-xs font-medium inline-flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Failed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {result.checks.syntax.valid
                  ? 'Standard email structure, mailbox length <= 64 chars, valid domain format.'
                  : `Syntax error: ${result.checks.syntax.reason}`}
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-200">
                User: {result.localPart || '(none)'} · Domain: {result.domain || '(none)'}
              </div>
            </div>

            {/* 2. DNS & MX Records */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Server className="w-4 h-4 text-slate-500" />
                  <span>DNS & Mail Exchange (MX)</span>
                </div>
                {result.checks.dns.hasMx ? (
                  <span className="text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    MX Found
                  </span>
                ) : result.checks.dns.hasFallbackA ? (
                  <span className="text-amber-700 text-xs font-medium inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Fallback A/AAAA
                  </span>
                ) : (
                  <span className="text-rose-700 text-xs font-medium inline-flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    {result.checks.dns.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {result.checks.dns.mxRecords.length > 0
                  ? `Active mail servers: ${result.checks.dns.mxRecords.slice(0, 2).join(', ')}${
                      result.checks.dns.mxRecords.length > 2
                        ? ` (+${result.checks.dns.mxRecords.length - 2} more)`
                        : ''
                    }`
                  : result.checks.dns.hasFallbackA
                  ? 'No explicit MX records, but domain possesses active A/AAAA fallback host routing.'
                  : 'No active mail exchange (MX) or address records discovered in authoritative DNS.'}
              </p>
              {result.checks.dns.responseTimeMs !== undefined && (
                <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-200">
                  DNS latency: {result.checks.dns.responseTimeMs}ms
                </div>
              )}
            </div>

            {/* 3. Disposable Email Detection */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Disposable Domain Filter</span>
                </div>
                {result.checks.disposable.isDisposable ? (
                  <span className="text-amber-700 text-xs font-medium inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Disposable
                  </span>
                ) : (
                  <span className="text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Clean Domain
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {result.checks.disposable.isDisposable
                  ? 'Domain is a known temporary or burner email provider (e.g. Mailinator, GuerrillaMail). High risk of unread messages and instant account abandonment.'
                  : 'Domain is not registered in our maintained database of 350+ disposable email networks.'}
              </p>
            </div>

            {/* 4. Role & Webmail Account */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Account Classification</span>
                </div>
                {result.checks.roleBased.isRoleBased ? (
                  <span className="text-amber-700 text-xs font-medium inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Role Account
                  </span>
                ) : result.checks.freeProvider.isFree ? (
                  <span className="text-blue-700 text-xs font-medium inline-flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Free Webmail
                  </span>
                ) : (
                  <span className="text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Personal / Corporate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600">
                {result.checks.roleBased.isRoleBased
                  ? 'Generic team address (e.g. admin@, info@, sales@, billing@). Usually forwarded to multiple recipients, resulting in lower personal reply rates.'
                  : result.checks.freeProvider.isFree
                  ? 'Public consumer webmail provider (e.g. Gmail, Outlook, Yahoo).'
                  : 'Individual corporate domain mailbox.'}
              </p>
            </div>
          </div>

          {/* Deliverability Transparency Note */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-lg flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Deliverability Integrity:</span> EmailCheck Pro guarantees
              that no test emails or intrusive socket spam is transmitted during validation.
              Final deliverability may also be impacted by recipient server spam filters, SPF/DKIM authentication,
              and mailbox quota capacity.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
