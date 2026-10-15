import * as XLSX from 'xlsx';
import { validateSingleEmail, ValidationResult } from './validationEngine.js';
import crypto from 'node:crypto';

export interface BulkJobRow {
  rowNumber: number;
  originalData: Record<string, any>;
  validation: ValidationResult;
}

export interface BulkJob {
  id: string;
  originalFilename: string;
  fileType: string;
  sheetName?: string;
  emailColumn: string;
  totalRows: number;
  processedRows: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  progressPercent: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  rows: BulkJobRow[];
  isCancelled?: boolean;
}

// In-memory Job store
const JOBS = new Map<string, BulkJob>();

/**
 * Helper to escape spreadsheet formula injection in CSV exports
 */
export function sanitizeForCsv(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // If string starts with formula triggering characters, escape it with a single quote
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // If string contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Inspect uploaded file buffer and extract sheets, headers, preview rows, and detected email column
 */
export function inspectFile(
  buffer: Buffer,
  filename: string,
  preferredSheet?: string
): {
  filename: string;
  fileType: string;
  sheets: string[];
  activeSheet: string;
  headers: string[];
  previewRows: Record<string, any>[];
  totalRowsEstimated: number;
  detectedEmailColumn: string | null;
} {
  const ext = filename.split('.').pop()?.toLowerCase() || 'csv';
  const isExcel = ext === 'xlsx' || ext === 'xls';
  const fileType = isExcel ? ext : 'csv';

  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    raw: false,
  });

  const sheets = workbook.SheetNames;
  const activeSheet = preferredSheet && sheets.includes(preferredSheet) ? preferredSheet : sheets[0];
  const worksheet = workbook.Sheets[activeSheet];

  if (!worksheet) {
    throw new Error('No readable sheet found in the uploaded file');
  }

  // Parse rows as JSON objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  const headers: string[] = [];
  if (rawRows.length > 0) {
    for (const key of Object.keys(rawRows[0])) {
      headers.push(key);
    }
  }

  // Auto-detect email column
  let detectedEmailColumn: string | null = null;
  const emailKeywords = ['email', 'e-mail', 'mail', 'email_address', 'contact_email', 'user_email'];

  for (const h of headers) {
    const clean = h.trim().toLowerCase();
    if (emailKeywords.includes(clean)) {
      detectedEmailColumn = h;
      break;
    }
  }

  if (!detectedEmailColumn) {
    // Check if any column contains '@' in the majority of preview rows
    for (const h of headers) {
      let atCount = 0;
      for (const row of rawRows.slice(0, 10)) {
        if (typeof row[h] === 'string' && row[h].includes('@')) {
          atCount++;
        }
      }
      if (atCount >= Math.min(3, rawRows.length)) {
        detectedEmailColumn = h;
        break;
      }
    }
  }

  return {
    filename,
    fileType,
    sheets,
    activeSheet,
    headers,
    previewRows: rawRows.slice(0, 10),
    totalRowsEstimated: rawRows.length,
    detectedEmailColumn,
  };
}

/**
 * Start asynchronous bulk processing for an uploaded file
 */
export async function createAndRunBulkJob(
  buffer: Buffer,
  filename: string,
  emailColumn: string,
  sheetName?: string
): Promise<BulkJob> {
  const ext = filename.split('.').pop()?.toLowerCase() || 'csv';
  const isExcel = ext === 'xlsx' || ext === 'xls';
  const fileType = isExcel ? ext : 'csv';

  const workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
  const activeSheet = sheetName && workbook.SheetNames.includes(sheetName)
    ? sheetName
    : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[activeSheet];

  if (!worksheet) {
    throw new Error('Sheet not found in uploaded file');
  }

  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  const jobId = crypto.randomUUID();
  const job: BulkJob = {
    id: jobId,
    originalFilename: filename,
    fileType,
    sheetName: activeSheet,
    emailColumn,
    totalRows: rawRows.length,
    processedRows: 0,
    validCount: 0,
    invalidCount: 0,
    riskyCount: 0,
    unknownCount: 0,
    status: 'PROCESSING',
    progressPercent: 0,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    rows: [],
  };

  JOBS.set(jobId, job);

  // Run bulk validation asynchronously in background so client gets instant job id
  processJobRows(job, rawRows, emailColumn).catch((err) => {
    job.status = 'FAILED';
    job.errorMessage = err.message || 'Error processing bulk file';
    job.completedAt = new Date().toISOString();
  });

  return job;
}

/**
 * Process rows in bounded batches with duplicate tracking and cancellation support
 */
async function processJobRows(
  job: BulkJob,
  rawRows: Record<string, any>[],
  emailColumn: string
) {
  const seenEmails = new Map<string, number>(); // normalized -> first seen row number
  const batchSize = 15;

  for (let i = 0; i < rawRows.length; i += batchSize) {
    if (job.isCancelled) {
      job.status = 'CANCELLED';
      job.completedAt = new Date().toISOString();
      return;
    }

    const batch = rawRows.slice(i, i + batchSize);
    const promises = batch.map(async (row, batchIdx) => {
      const rowNumber = i + batchIdx + 1;
      const rawEmail = String(row[emailColumn] || '').trim();

      try {
        const valResult = await validateSingleEmail(rawEmail);
        const norm = valResult.normalizedEmail;

        if (norm && seenEmails.has(norm)) {
          const firstRow = seenEmails.get(norm)!;
          valResult.isDuplicate = true;
          valResult.score = Math.max(0, valResult.score - 15);
          if (valResult.status === 'VALID') {
            valResult.status = 'RISKY';
          }
          valResult.comment = `${valResult.comment} [Duplicate of row #${firstRow}]`;
        } else if (norm) {
          seenEmails.set(norm, rowNumber);
        }

        return {
          rowNumber,
          originalData: row,
          validation: valResult,
        };
      } catch (err: any) {
        // Individual row failure must not crash the job
        const fallbackResult: ValidationResult = {
          originalEmail: rawEmail,
          normalizedEmail: rawEmail.toLowerCase(),
          localPart: '',
          domain: '',
          status: 'UNKNOWN',
          score: 50,
          comment: `Row processing error: ${err.message || 'Unknown error'}`,
          checks: {
            syntax: { valid: false, reason: 'Evaluation error' },
            domain: { name: '', validSyntax: false, isIDNA: false },
            dns: { hasMx: false, hasFallbackA: false, mxRecords: [], status: 'ERROR' },
            disposable: { isDisposable: false },
            roleBased: { isRoleBased: false },
            freeProvider: { isFree: false },
          },
          validatedAt: new Date().toISOString(),
        };

        return {
          rowNumber,
          originalData: row,
          validation: fallbackResult,
        };
      }
    });

    const results = await Promise.all(promises);

    for (const res of results) {
      job.rows.push(res);
      job.processedRows++;

      switch (res.validation.status) {
        case 'VALID':
          job.validCount++;
          break;
        case 'INVALID':
          job.invalidCount++;
          break;
        case 'RISKY':
          job.riskyCount++;
          break;
        case 'UNKNOWN':
          job.unknownCount++;
          break;
      }
    }

    job.progressPercent = Math.min(100, Math.round((job.processedRows / (job.totalRows || 1)) * 100));
  }

  job.status = 'COMPLETED';
  job.completedAt = new Date().toISOString();
}

/**
 * Retrieve job status
 */
export function getJob(jobId: string): BulkJob | undefined {
  return JOBS.get(jobId);
}

/**
 * Cancel a running job
 */
export function cancelJob(jobId: string): boolean {
  const job = JOBS.get(jobId);
  if (!job) return false;
  if (job.status === 'PROCESSING' || job.status === 'PENDING') {
    job.isCancelled = true;
    job.status = 'CANCELLED';
    job.completedAt = new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Delete a job from memory
 */
export function deleteJob(jobId: string): boolean {
  return JOBS.delete(jobId);
}

/**
 * List all jobs (Validation History)
 */
export function listJobs(): Omit<BulkJob, 'rows'>[] {
  const list: Omit<BulkJob, 'rows'>[] = [];
  for (const job of JOBS.values()) {
    const { rows, ...rest } = job;
    list.push(rest);
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Paginate and filter job results
 */
export function getJobResults(
  jobId: string,
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
) {
  const job = JOBS.get(jobId);
  if (!job) return null;

  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 20));
  const search = (options.search || '').trim().toLowerCase();
  const statusFilter = (options.statusFilter || 'ALL').toUpperCase();

  let filtered = job.rows.filter((item) => {
    if (statusFilter !== 'ALL' && item.validation.status !== statusFilter) {
      return false;
    }
    if (search) {
      const matchEmail = item.validation.originalEmail.toLowerCase().includes(search) ||
        item.validation.normalizedEmail.toLowerCase().includes(search);
      const matchComment = item.validation.comment.toLowerCase().includes(search);
      return matchEmail || matchComment;
    }
    return true;
  });

  // Sorting
  const sortBy = options.sortBy || 'rowNumber';
  const sortOrder = options.sortOrder === 'desc' ? -1 : 1;

  filtered.sort((a, b) => {
    if (sortBy === 'score') {
      return (a.validation.score - b.validation.score) * sortOrder;
    }
    if (sortBy === 'email') {
      return a.validation.originalEmail.localeCompare(b.validation.originalEmail) * sortOrder;
    }
    if (sortBy === 'status') {
      return a.validation.status.localeCompare(b.validation.status) * sortOrder;
    }
    return (a.rowNumber - b.rowNumber) * sortOrder;
  });

  const totalFiltered = filtered.length;
  const start = (page - 1) * pageSize;
  const paginatedRows = filtered.slice(start, start + pageSize);

  return {
    jobId: job.id,
    page,
    pageSize,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    totalFiltered,
    totalPages: Math.ceil(totalFiltered / pageSize),
    status: job.status,
    progressPercent: job.progressPercent,
    validCount: job.validCount,
    invalidCount: job.invalidCount,
    riskyCount: job.riskyCount,
    unknownCount: job.unknownCount,
    rows: paginatedRows,
  };
}

/**
 * Generate CSV export content with safe spreadsheet formula escaping
 */
export function generateCsvExport(job: BulkJob, statusFilter?: string): string {
  let rows = job.rows;
  if (statusFilter && statusFilter !== 'ALL') {
    rows = rows.filter((r) => r.validation.status === statusFilter.toUpperCase());
  }

  if (rows.length === 0) {
    return 'Original Email,Normalized Email,Syntax Status,Domain Status,MX Status,Disposable Domain,Role Based,Duplicate,Final Status,Score,Validation Comment,Validated At\n';
  }

  // Get original data keys
  const originalKeys = Object.keys(rows[0].originalData || {});
  const headers = [
    ...originalKeys,
    'Validation_OriginalEmail',
    'Validation_NormalizedEmail',
    'Validation_SyntaxStatus',
    'Validation_DomainStatus',
    'Validation_MxStatus',
    'Validation_Disposable',
    'Validation_RoleBased',
    'Validation_Duplicate',
    'Validation_FinalStatus',
    'Validation_Score',
    'Validation_Comment',
    'Validation_ValidatedAt',
  ];

  const csvLines: string[] = [];
  csvLines.push(headers.map(sanitizeForCsv).join(','));

  for (const item of rows) {
    const v = item.validation;
    const lineValues: any[] = [];

    // Original data
    for (const key of originalKeys) {
      lineValues.push(item.originalData[key] ?? '');
    }

    // Validation columns
    lineValues.push(v.originalEmail);
    lineValues.push(v.normalizedEmail);
    lineValues.push(v.checks.syntax.valid ? 'VALID' : 'INVALID');
    lineValues.push(v.checks.domain.validSyntax ? 'VALID' : 'INVALID');
    lineValues.push(v.checks.dns.hasMx ? 'MX_FOUND' : (v.checks.dns.hasFallbackA ? 'FALLBACK_A' : v.checks.dns.status));
    lineValues.push(v.checks.disposable.isDisposable ? 'YES' : 'NO');
    lineValues.push(v.checks.roleBased.isRoleBased ? 'YES' : 'NO');
    lineValues.push(v.isDuplicate ? 'YES' : 'NO');
    lineValues.push(v.status);
    lineValues.push(v.score);
    lineValues.push(v.comment);
    lineValues.push(v.validatedAt);

    csvLines.push(lineValues.map(sanitizeForCsv).join(','));
  }

  return csvLines.join('\r\n');
}

/**
 * Generate Excel (.xlsx) export buffer
 */
export function generateExcelExport(job: BulkJob, statusFilter?: string): Buffer {
  let rows = job.rows;
  if (statusFilter && statusFilter !== 'ALL') {
    rows = rows.filter((r) => r.validation.status === statusFilter.toUpperCase());
  }

  const exportData: Record<string, any>[] = [];

  for (const item of rows) {
    const v = item.validation;
    const rowObj: Record<string, any> = { ...item.originalData };

    // Prevent formula injection in Excel cells
    for (const k of Object.keys(rowObj)) {
      if (typeof rowObj[k] === 'string' && /^[\=\+\-\@\t\r]/.test(rowObj[k])) {
        rowObj[k] = `'${rowObj[k]}`;
      }
    }

    rowObj['Validation_OriginalEmail'] = v.originalEmail;
    rowObj['Validation_NormalizedEmail'] = v.normalizedEmail;
    rowObj['Validation_SyntaxStatus'] = v.checks.syntax.valid ? 'VALID' : 'INVALID';
    rowObj['Validation_DomainStatus'] = v.checks.domain.validSyntax ? 'VALID' : 'INVALID';
    rowObj['Validation_MxStatus'] = v.checks.dns.hasMx ? 'MX_FOUND' : (v.checks.dns.hasFallbackA ? 'FALLBACK_A' : v.checks.dns.status);
    rowObj['Validation_Disposable'] = v.checks.disposable.isDisposable ? 'YES' : 'NO';
    rowObj['Validation_RoleBased'] = v.checks.roleBased.isRoleBased ? 'YES' : 'NO';
    rowObj['Validation_Duplicate'] = v.isDuplicate ? 'YES' : 'NO';
    rowObj['Validation_FinalStatus'] = v.status;
    rowObj['Validation_Score'] = v.score;
    rowObj['Validation_Comment'] = v.comment;
    rowObj['Validation_ValidatedAt'] = v.validatedAt;

    exportData.push(rowObj);
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Report');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
