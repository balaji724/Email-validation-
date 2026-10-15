export type FinalStatus = 'VALID' | 'INVALID' | 'RISKY' | 'UNKNOWN';

export interface DetailedChecks {
  syntax: {
    valid: boolean;
    reason?: string;
  };
  domain: {
    name: string;
    validSyntax: boolean;
    isIDNA: boolean;
  };
  dns: {
    hasMx: boolean;
    hasFallbackA: boolean;
    mxRecords: string[];
    status: 'FOUND' | 'NO_RECORDS' | 'NXDOMAIN' | 'TIMEOUT' | 'ERROR';
    responseTimeMs?: number;
  };
  disposable: {
    isDisposable: boolean;
  };
  roleBased: {
    isRoleBased: boolean;
  };
  freeProvider: {
    isFree: boolean;
  };
}

export interface SingleValidationResult {
  originalEmail: string;
  normalizedEmail: string;
  localPart: string;
  domain: string;
  status: FinalStatus;
  score: number;
  comment: string;
  checks: DetailedChecks;
  isDuplicate?: boolean;
  validatedAt: string;
}

export interface FilePreviewResponse {
  filename: string;
  fileType: string;
  sheets: string[];
  activeSheet: string;
  headers: string[];
  previewRows: Record<string, any>[];
  totalRowsEstimated: number;
  detectedEmailColumn: string | null;
}

export interface BulkJobSummary {
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
}

export interface BulkJobRow {
  rowNumber: number;
  originalData: Record<string, any>;
  validation: SingleValidationResult;
}

export interface PaginatedJobResults {
  jobId: string;
  page: number;
  pageSize: number;
  totalRows: number;
  processedRows: number;
  totalFiltered: number;
  totalPages: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  progressPercent: number;
  validCount: number;
  invalidCount: number;
  riskyCount: number;
  unknownCount: number;
  rows: BulkJobRow[];
}

export interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCreditLimit: number;
  bulkUploadLimit: number;
  isPopular?: boolean;
  features: string[];
  isActive: boolean;
}

export interface UsageSummary {
  planId: string;
  planName: string;
  creditsLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  resetDate: string;
  stats: {
    totalProcessed: number;
    totalValid: number;
    totalInvalid: number;
    totalRisky: number;
    totalUnknown: number;
    totalJobs: number;
  };
}
