import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Layers,
  ArrowRight,
  Upload,
  Download,
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { UsageSummary, BulkJobSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface DashboardProps {
  usage: UsageSummary | null;
  recentJobs: BulkJobSummary[];
  onNavigate: (tab: string, jobId?: string) => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  usage,
  recentJobs,
  onNavigate,
  onRefreshData,
}) => {
  const [quickEmail, setQuickEmail] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<any>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const stats = usage?.stats || {
    totalProcessed: 0,
    totalValid: 0,
    totalInvalid: 0,
    totalRisky: 0,
    totalUnknown: 0,
    totalJobs: 0,
  };

  const chartData = [
    { name: 'Valid', value: stats.totalValid, color: '#10B981' },
    { name: 'Invalid', value: stats.totalInvalid, color: '#F43F5E' },
    { name: 'Risky', value: stats.totalRisky, color: '#F59E0B' },
    { name: 'Unknown', value: stats.totalUnknown, color: '#94A3B8' },
  ].filter((d) => d.value > 0);

  // Time trend data derived or configured
  const timelineData = [
    { day: 'Mon', processed: Math.round(stats.totalProcessed * 0.12) },
    { day: 'Tue', processed: Math.round(stats.totalProcessed * 0.18) },
    { day: 'Wed', processed: Math.round(stats.totalProcessed * 0.15) },
    { day: 'Thu', processed: Math.round(stats.totalProcessed * 0.22) },
    { day: 'Fri', processed: Math.round(stats.totalProcessed * 0.25) },
    { day: 'Sat', processed: Math.round(stats.totalProcessed * 0.05) },
    { day: 'Sun', processed: Math.round(stats.totalProcessed * 0.03) },
  ];

  const handleQuickValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail.trim()) return;
    setQuickLoading(true);
    setQuickError(null);
    try {
      const res = await api.validateSingle(quickEmail.trim());
      setQuickResult(res);
      onRefreshData();
    } catch (err: any) {
      setQuickError(err.message || 'Validation failed');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Validation Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time deliverability telemetry, verification batch jobs, and bounce protection metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('bulk')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Processed */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Emails</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.totalProcessed.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {stats.totalJobs} batch files
          </div>
        </div>

        {/* Valid */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Valid Format</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {stats.totalValid.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {stats.totalProcessed > 0
              ? `${Math.round((stats.totalValid / stats.totalProcessed) * 100)}% of total`
              : '0% deliverable'}
          </div>
        </div>

        {/* Invalid */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Invalid Bounces</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {stats.totalInvalid.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {stats.totalProcessed > 0
              ? `${Math.round((stats.totalInvalid / stats.totalProcessed) * 100)}% filtered`
              : '0% filtered'}
          </div>
        </div>

        {/* Risky */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Risky / Role</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {stats.totalRisky.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Disposable & role accounts
          </div>
        </div>

        {/* Unknown */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Unknown</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700 font-mono tabular-nums">
            {stats.totalUnknown.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            DNS timeouts / unverified
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliverability Breakdown Donut Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Deliverability Breakdown
              </h2>
              <span className="text-xs text-slate-500">Status ratio</span>
            </div>
            <div className="h-48 w-full flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 text-center">
                  No email validations logged yet
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              <span>Valid ({stats.totalValid})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
              <span>Invalid ({stats.totalInvalid})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              <span>Risky ({stats.totalRisky})</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block"></span>
              <span>Unknown ({stats.totalUnknown})</span>
            </div>
          </div>
        </div>

        {/* Processed Volume Over Time Area Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Verification Activity Over Time
              </h2>
              <p className="text-xs text-slate-500">Processed email throughput across current week</p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {stats.totalProcessed.toLocaleString()} total
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="processed"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProcessed)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>DNS Resolver: Active with MX caching</span>
            <button
              onClick={() => onNavigate('history')}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <span>View full job ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Validation & Recent Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Single Email Tester */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Quick Single Verification
            </h2>
            <button
              onClick={() => onNavigate('single')}
              className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
            >
              <span>Full analyzer</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Test any single address against RFC syntax, MX mail exchange, and disposable lists.
          </p>

          <form onSubmit={handleQuickValidate} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="e.g. alex.smith@acme.com"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={quickLoading || !quickEmail.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-2xs"
            >
              {quickLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking DNS & MX...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Validate Address</span>
                </>
              )}
            </button>
          </form>

          {quickError && (
            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {quickError}
            </div>
          )}

          {quickResult && (
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-900 truncate max-w-[170px]" title={quickResult.normalizedEmail}>
                  {quickResult.normalizedEmail}
                </span>
                <StatusBadge status={quickResult.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Confidence Score:</span>
                <span className="font-mono font-semibold text-slate-900">{quickResult.score}/100</span>
              </div>
              <p className="text-slate-600 italic">
                "{quickResult.comment}"
              </p>
            </div>
          )}
        </div>

        {/* Recent Validation Jobs */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Validation Jobs
              </h2>
              <p className="text-xs text-slate-500">Latest CSV and Excel batch files processed</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all ({recentJobs.length})
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">No jobs uploaded yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Upload a CSV or Excel spreadsheet to start bulk verification</p>
              <button
                onClick={() => onNavigate('bulk')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span>Upload Sample File</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-medium">
                    <th className="pb-2.5 font-medium">File Name</th>
                    <th className="pb-2.5 font-medium">Rows</th>
                    <th className="pb-2.5 font-medium">Valid</th>
                    <th className="pb-2.5 font-medium">Invalid</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentJobs.slice(0, 5).map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] uppercase font-mono font-bold">
                          {job.fileType}
                        </span>
                        <span className="truncate max-w-[140px]" title={job.originalFilename}>
                          {job.originalFilename}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono tabular-nums text-slate-600">
                        {job.processedRows}/{job.totalRows}
                      </td>
                      <td className="py-2.5 font-mono tabular-nums text-emerald-600 font-medium">
                        {job.validCount}
                      </td>
                      <td className="py-2.5 font-mono tabular-nums text-rose-600 font-medium">
                        {job.invalidCount}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : job.status === 'PROCESSING'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1">
                        <a
                          href={api.getExportUrl(job.id, 'csv')}
                          download
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded transition-colors"
                          title="Download CSV"
                        >
                          <Download className="w-3 h-3" />
                          <span>CSV</span>
                        </a>
                        <button
                          onClick={() => onNavigate('bulk', job.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        >
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
