import React, { useState } from 'react';
import {
  History,
  Download,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { BulkJobSummary } from '../types';
import { api } from '../services/api';

interface ValidationHistoryProps {
  jobs: BulkJobSummary[];
  onInspectJob: (jobId: string) => void;
  onRefresh: () => void;
  onNavigateToUpload: () => void;
}

export const ValidationHistory: React.FC<ValidationHistoryProps> = ({
  jobs,
  onInspectJob,
  onRefresh,
  onNavigateToUpload,
}) => {
  const [jobToDelete, setJobToDelete] = useState<BulkJobSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setDeleting(true);
    try {
      await api.deleteJob(jobToDelete.id);
      setJobToDelete(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete job');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Validation History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit log of all bulk verification jobs, deliverability breakdown reports, and spreadsheet exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Ledger</span>
          </button>
          <button
            onClick={onNavigateToUpload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      {/* History Table or Empty State */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">No validation jobs yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your customer or leads spreadsheet to start batch cleaning and tracking deliverability rates.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Spreadsheet</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Spreadsheet / Job</th>
                  <th className="px-4 py-3 font-medium">Uploaded Date</th>
                  <th className="px-4 py-3 font-medium">Rows</th>
                  <th className="px-4 py-3 font-medium">Deliverability Results</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                          {job.fileType}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 truncate max-w-xs" title={job.originalFilename}>
                            {job.originalFilename}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            ID: {job.id.slice(0, 8)}... · Col: {job.emailColumn}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-700">
                      {job.processedRows} / {job.totalRows}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 font-mono tabular-nums">
                        <span className="text-emerald-600 font-medium inline-flex items-center gap-1" title="Valid Format">
                          <CheckCircle2 className="w-3 h-3" />
                          {job.validCount}
                        </span>
                        <span className="text-rose-600 font-medium inline-flex items-center gap-1" title="Invalid">
                          <XCircle className="w-3 h-3" />
                          {job.invalidCount}
                        </span>
                        <span className="text-amber-600 font-medium inline-flex items-center gap-1" title="Risky & Role">
                          <AlertTriangle className="w-3 h-3" />
                          {job.riskyCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'PROCESSING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : job.status === 'CANCELLED'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onInspectJob(job.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <a
                          href={api.getExportUrl(job.id, 'xlsx')}
                          download
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          title="Download Excel Report"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={api.getExportUrl(job.id, 'csv')}
                          download
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          title="Download CSV Report"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setJobToDelete(job)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Delete Validation Job?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-700">"{jobToDelete.originalFilename}"</strong>?
                  All parsed rows, verification logs, and export downloads for this batch will be wiped immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
              >
                Keep File
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
              >
                {deleting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
