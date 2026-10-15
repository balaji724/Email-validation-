import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  StopCircle,
  RefreshCw,
  FileText,
  Check,
  Table,
} from 'lucide-react';
import {
  FilePreviewResponse,
  BulkJobSummary,
  PaginatedJobResults,
  BulkJobRow,
} from '../types';
import { StatusBadge, ScoreBadge } from '../components/StatusBadge';
import { api } from '../services/api';

interface BulkValidatorProps {
  initialJobId?: string | null;
  onJobCompleted?: () => void;
}

export const BulkValidator: React.FC<BulkValidatorProps> = ({
  initialJobId,
  onJobCompleted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreviewResponse | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Active Job State
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobId || null);
  const [jobSummary, setJobSummary] = useState<BulkJobSummary | null>(null);
  const [resultsData, setResultsData] = useState<PaginatedJobResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Table Filter & Pagination State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('rowNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<number | null>(null);

  // If initialJobId is supplied, load it immediately
  useEffect(() => {
    if (initialJobId) {
      setActiveJobId(initialJobId);
      loadJob(initialJobId);
    }
  }, [initialJobId]);

  // Polling active job
  useEffect(() => {
    if (!activeJobId) return;

    const poll = async () => {
      try {
        const summary = await api.getJob(activeJobId);
        setJobSummary(summary);

        if (summary.status === 'PROCESSING' || summary.status === 'PENDING') {
          pollingRef.current = window.setTimeout(poll, 1200);
        } else {
          // Finished or cancelled
          if (onJobCompleted) onJobCompleted();
          loadResults(activeJobId, page, pageSize, searchQuery, statusFilter, sortBy, sortOrder);
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    };

    poll();

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [activeJobId]);

  // Load results whenever filters/pagination change
  useEffect(() => {
    if (activeJobId && jobSummary) {
      loadResults(activeJobId, page, pageSize, searchQuery, statusFilter, sortBy, sortOrder);
    }
  }, [activeJobId, page, pageSize, statusFilter, sortBy, sortOrder]);

  const loadJob = async (id: string) => {
    try {
      const summary = await api.getJob(id);
      setJobSummary(summary);
      await loadResults(id, 1, pageSize, searchQuery, statusFilter, sortBy, sortOrder);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to load job');
    }
  };

  const loadResults = async (
    id: string,
    p: number,
    size: number,
    query: string,
    status: string,
    sBy: string,
    sOrder: 'asc' | 'desc'
  ) => {
    setResultsLoading(true);
    try {
      const data = await api.getJobResults(id, {
        page: p,
        pageSize: size,
        search: query,
        status,
        sortBy: sBy,
        sortOrder: sOrder,
      });
      setResultsData(data);
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);

    try {
      const prev = await api.previewFile(file);
      setPreview(prev);
      setSelectedSheet(prev.activeSheet);
      setSelectedColumn(prev.detectedEmailColumn || prev.headers[0] || '');
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to parse file preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSheetChange = async (sheet: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheet);
    setPreviewLoading(true);
    try {
      const prev = await api.previewFile(selectedFile, sheet);
      setPreview(prev);
      setSelectedColumn(prev.detectedEmailColumn || prev.headers[0] || '');
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to switch sheet');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleStartValidation = async () => {
    if (!selectedFile || !selectedColumn) return;
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const res = await api.startBulkValidation(selectedFile, selectedColumn, selectedSheet);
      setActiveJobId(res.jobId);
      setPage(1);
      // Clear file preview selection now that job has started
      setPreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to start validation job');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJobId) return;
    try {
      await api.cancelJob(activeJobId);
      const summary = await api.getJob(activeJobId);
      setJobSummary(summary);
    } catch (err: any) {
      alert(err.message || 'Could not cancel job');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (activeJobId) {
      loadResults(activeJobId, 1, pageSize, searchQuery, statusFilter, sortBy, sortOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bulk Email Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload CSV or Excel files. Verify thousands of records with automatic column detection,
            duplicate flagging, and safe formula-escaped exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/v1/sample-file"
            download="sample_emails.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Sample CSV</span>
          </a>
          {activeJobId && (
            <button
              onClick={() => {
                setActiveJobId(null);
                setJobSummary(null);
                setResultsData(null);
                setPreview(null);
                setSelectedFile(null);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Another File</span>
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Upload Card (Visible if no active job and no preview) */}
      {!activeJobId && !preview && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/20 rounded-xl p-10 text-center transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">
            Choose a file or drag & drop it here
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Supports <strong className="text-slate-700">.csv</strong>, <strong className="text-slate-700">.xlsx</strong>, and <strong className="text-slate-700">.xls</strong> files.
            Configured upload limit: up to 10,000 rows (10 MB).
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Browse Spreadsheet</span>
          </div>

          {previewLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Parsing spreadsheet structure...</span>
            </div>
          )}

          {previewError && (
            <div className="mt-4 p-3 max-w-md mx-auto bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {previewError}
            </div>
          )}
        </div>
      )}

      {/* Step 2: File Preview & Column Selection */}
      {!activeJobId && preview && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {preview.filename}
                </h3>
                <p className="text-xs text-slate-500">
                  ~{preview.totalRowsEstimated} total rows detected · Format: {preview.fileType.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Choose different file
            </button>
          </div>

          {/* Controls: Sheet Selector & Column Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            {/* Sheet Selector for Excel */}
            {preview.sheets.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Worksheet
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {preview.sheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email Column Selector */}
            <div className={preview.sheets.length > 1 ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Select Email Column</span>
                {preview.detectedEmailColumn && (
                  <span className="text-[11px] text-emerald-600 font-normal">
                    Auto-detected: "{preview.detectedEmailColumn}"
                  </span>
                )}
              </label>
              <select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    Column: {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* First 10 Rows Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Data Preview (First 10 records)
              </span>
              <span className="text-xs text-slate-400">
                Preserves all original columns and row order
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium w-12 text-slate-400">#</th>
                    {preview.headers.map((h) => (
                      <th
                        key={h}
                        className={`px-3 py-2 font-medium whitespace-nowrap ${
                          h === selectedColumn
                            ? 'text-blue-700 bg-blue-100/60 font-semibold'
                            : ''
                        }`}
                      >
                        {h} {h === selectedColumn && '(Email)'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {preview.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 font-normal">{idx + 1}</td>
                      {preview.headers.map((h) => (
                        <td
                          key={h}
                          className={`px-3 py-2 whitespace-nowrap text-slate-700 ${
                            h === selectedColumn ? 'bg-blue-50/50 font-medium text-blue-900' : ''
                          }`}
                        >
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Start Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartValidation}
              disabled={previewLoading || !selectedColumn}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
            >
              {previewLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Job...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Start Validation Job ({preview.totalRowsEstimated} rows)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Active Job Progress & Results Table */}
      {activeJobId && jobSummary && (
        <div className="space-y-6">
          {/* Progress Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 text-sm">
                    {jobSummary.originalFilename}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      jobSummary.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : jobSummary.status === 'PROCESSING'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : jobSummary.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {jobSummary.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Job ID: <span className="font-mono">{jobSummary.id}</span> · Column: <span className="font-mono text-slate-700 font-medium">{jobSummary.emailColumn}</span>
                </p>
              </div>

              {/* Progress & Cancel */}
              <div className="flex items-center gap-3">
                {jobSummary.status === 'PROCESSING' && (
                  <button
                    onClick={handleCancelJob}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Cancel Job</span>
                  </button>
                )}

                {/* Export Dropdown buttons */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={api.getExportUrl(jobSummary.id, 'xlsx', statusFilter)}
                    download
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                    title="Download Excel with formula defense"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Excel (.xlsx)</span>
                  </a>
                  <a
                    href={api.getExportUrl(jobSummary.id, 'csv', statusFilter)}
                    download
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                    title="Download CSV with formula defense"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>CSV (.csv)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <span className="font-medium">
                  Progress: {jobSummary.processedRows} of {jobSummary.totalRows} rows
                </span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {jobSummary.progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${jobSummary.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stat Counters Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-slate-500">Valid Format</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {jobSummary.validCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <div className="text-slate-500">Invalid Bounces</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {jobSummary.invalidCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="text-slate-500">Risky & Role</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {jobSummary.riskyCount}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-slate-500">Unknown</div>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {jobSummary.unknownCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Results Table Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            {/* Table Filters Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Segmented Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                {['ALL', 'VALID', 'INVALID', 'RISKY', 'UNKNOWN'].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      statusFilter === s
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {s === 'ALL' ? 'All Rows' : s}
                  </button>
                ))}
              </div>

              {/* Search input & Page Size */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search email or reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </form>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto min-h-[300px]">
              {resultsLoading && !resultsData ? (
                <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading validated records...</span>
                </div>
              ) : resultsData && resultsData.rows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No records match current filter criteria
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th
                        onClick={() => {
                          setSortBy('rowNumber');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="px-3.5 py-2.5 font-medium cursor-pointer hover:text-slate-900 w-16"
                      >
                        <div className="flex items-center gap-1">
                          <span>Row</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortBy('email');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="px-3.5 py-2.5 font-medium cursor-pointer hover:text-slate-900"
                      >
                        <div className="flex items-center gap-1">
                          <span>Email Address</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortBy('status');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="px-3.5 py-2.5 font-medium cursor-pointer hover:text-slate-900"
                      >
                        <div className="flex items-center gap-1">
                          <span>Final Status</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => {
                          setSortBy('score');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="px-3.5 py-2.5 font-medium cursor-pointer hover:text-slate-900 text-center"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Score</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="px-3.5 py-2.5 font-medium">Verification Comment</th>
                      <th className="px-3.5 py-2.5 font-medium">Signals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resultsData?.rows.map((row) => (
                      <tr key={row.rowNumber} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono text-slate-400 tabular-nums">
                          #{row.rowNumber}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-mono text-slate-900 font-medium">
                            {row.validation.originalEmail}
                          </div>
                          {row.validation.originalEmail !== row.validation.normalizedEmail && (
                            <div className="text-[11px] font-mono text-slate-400">
                              Norm: {row.validation.normalizedEmail}
                            </div>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <StatusBadge status={row.validation.status} size="sm" />
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <ScoreBadge score={row.validation.score} />
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 max-w-xs">
                          {row.validation.comment}
                        </td>
                        <td className="px-3.5 py-2.5 text-[11px] text-slate-500">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.validation.checks.dns.hasMx && (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                MX
                              </span>
                            )}
                            {row.validation.checks.disposable.isDisposable && (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                                Disposable
                              </span>
                            )}
                            {row.validation.checks.roleBased.isRoleBased && (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                                Role
                              </span>
                            )}
                            {row.validation.isDuplicate && (
                              <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px]">
                                Duplicate
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {resultsData && resultsData.totalPages > 1 && (
              <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Showing {Math.min(resultsData.totalFiltered, (page - 1) * pageSize + 1)} to{' '}
                  {Math.min(resultsData.totalFiltered, page * pageSize)} of{' '}
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {resultsData.totalFiltered}
                  </span>{' '}
                  records
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>

                  <span className="px-2 font-mono tabular-nums text-slate-700">
                    Page {page} of {resultsData.totalPages}
                  </span>

                  <button
                    disabled={page >= resultsData.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
