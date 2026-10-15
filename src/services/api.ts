import {
  SingleValidationResult,
  FilePreviewResponse,
  BulkJobSummary,
  PaginatedJobResults,
  Plan,
  UsageSummary,
} from '../types';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Single email validation
  async validateSingle(email: string, treatRoleAsRisky = true): Promise<SingleValidationResult> {
    const res = await fetch('/api/v1/validate/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, treatRoleAsRisky }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Validation failed' }));
      throw new Error(err.error || 'Failed to validate email');
    }
    return res.json();
  },

  // File preview
  async previewFile(file: File, sheetName?: string): Promise<FilePreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheetName) formData.append('sheetName', sheetName);

    const res = await fetch('/api/v1/files/preview', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Preview failed' }));
      throw new Error(err.error || 'Failed to preview file');
    }
    return res.json();
  },

  // Bulk upload and start job
  async startBulkValidation(file: File, emailColumn: string, sheetName?: string): Promise<{ jobId: string; totalRows: number }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('emailColumn', emailColumn);
    if (sheetName) formData.append('sheetName', sheetName);

    const res = await fetch('/api/v1/validate/bulk', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Bulk upload failed' }));
      throw new Error(err.error || 'Failed to start bulk job');
    }
    return res.json();
  },

  // Get job summary
  async getJob(jobId: string): Promise<BulkJobSummary> {
    const res = await fetch(`/api/v1/jobs/${jobId}`);
    if (!res.ok) throw new Error('Job not found');
    return res.json();
  },

  // Get paginated job results
  async getJobResults(
    jobId: string,
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedJobResults> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const res = await fetch(`/api/v1/jobs/${jobId}/results?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch job results');
    return res.json();
  },

  // Cancel job
  async cancelJob(jobId: string): Promise<void> {
    const res = await fetch(`/api/v1/jobs/${jobId}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel job');
  },

  // List validation history
  async getHistory(): Promise<{ jobs: BulkJobSummary[]; total: number }> {
    const res = await fetch('/api/v1/history');
    if (!res.ok) throw new Error('Failed to load history');
    return res.json();
  },

  // Delete job
  async deleteJob(jobId: string): Promise<void> {
    const res = await fetch(`/api/v1/jobs/${jobId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete job');
  },

  // Usage summary
  async getUsage(): Promise<UsageSummary> {
    const res = await fetch('/api/v1/usage');
    if (!res.ok) throw new Error('Failed to fetch usage');
    return res.json();
  },

  // Plans
  async getPlans(): Promise<{ plans: Plan[] }> {
    const res = await fetch('/api/v1/plans');
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  },

  // Download export URL helpers
  getExportUrl(jobId: string, format: 'xlsx' | 'csv', statusFilter = 'ALL') {
    return `/api/v1/jobs/${jobId}/export?format=${format}&status=${encodeURIComponent(statusFilter)}`;
  },
};
