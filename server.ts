import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSingleEmail } from './src/server/validationEngine.js';
import {
  inspectFile,
  createAndRunBulkJob,
  getJob,
  cancelJob,
  deleteJob,
  listJobs,
  getJobResults,
  generateCsvExport,
  generateExcelExport,
} from './src/server/bulkProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev server runs on port 3000
const PORT = 3000;

// Maximum upload file size (default 10 MB)
const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Simulated usage and subscription state
const USAGE_STATE = {
  planId: 'starter',
  planName: 'Starter Plan',
  creditsLimit: 10000,
  creditsUsed: 1420,
  billingCycleResetDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

const PLANS = [
  {
    id: 'free',
    name: 'Free Community',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCreditLimit: 100,
    bulkUploadLimit: 100,
    features: [
      '100 single validations / month',
      'Up to 100 rows per bulk upload',
      'RFC 5322 syntax validation',
      'DNS & MX record lookups',
      'Basic disposable domain list',
      'Standard CSV export',
    ],
    isActive: true,
  },
  {
    id: 'starter',
    name: 'Starter Pro',
    monthlyPrice: 29,
    annualPrice: 290,
    monthlyCreditLimit: 10000,
    bulkUploadLimit: 5000,
    isPopular: true,
    features: [
      '10,000 validations / month',
      'Up to 5,000 rows per bulk upload',
      'Priority DNS resolver with fallback A/AAAA routing',
      'Comprehensive disposable & burner domain detection',
      'Role-based mailbox detection (info@, sales@, etc.)',
      'Excel (.xlsx) and CSV exports with formula injection defense',
      '30-day job history retention',
    ],
    isActive: true,
  },
  {
    id: 'professional',
    name: 'Business Scale',
    monthlyPrice: 79,
    annualPrice: 790,
    monthlyCreditLimit: 50000,
    bulkUploadLimit: 25000,
    features: [
      '50,000 validations / month',
      'Up to 25,000 rows per bulk upload',
      'Multi-sheet Excel workbook support',
      'Fast parallel DNS lookup cluster',
      'Export filtering (Valid, Risky, Invalid separated)',
      'Custom webhook integration (Coming soon)',
      '90-day job history retention',
      'Priority customer support',
    ],
    isActive: true,
  },
];

// Seed initial sample job for instant demonstration if history is empty
(() => {
  const sampleCsvContent = `first_name,last_name,email,company
Alice,Smith,alice.smith@gmail.com,Acme Corp
Bob,Jones,support@github.com,GitHub
Charlie,Brown,charlie@temp-mail.org,Disposable Inc
David,Miller,invalid-email-format,Unknown
Eve,Wilson,eve@nonexistent-domain-xyz-123.com,Ghost LLC
Frank,Taylor,alice.smith@gmail.com,Acme Duplicate`;

  const inspect = inspectFile(Buffer.from(sampleCsvContent), 'sample_leads.csv');
  createAndRunBulkJob(Buffer.from(sampleCsvContent), 'sample_leads.csv', 'email').catch(() => {});
})();

// ==========================================
// API Endpoints
// ==========================================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'EmailCheck Pro Engine',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Download sample test CSV
app.get('/api/v1/sample-file', (req: Request, res: Response) => {
  const samplePath = path.resolve(__dirname, 'sample_data', 'sample_emails.csv');
  res.download(samplePath, 'sample_emails.csv');
});

// 2. Single email validation
app.post('/api/v1/validate/single', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, treatRoleAsRisky } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Field "email" is required' });
      return;
    }

    const result = await validateSingleEmail(email, {
      treatRoleAsRisky: treatRoleAsRisky !== false,
    });

    USAGE_STATE.creditsUsed += 1;

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// 3. File preview (inspect sheets, headers, detected email column)
app.post('/api/v1/files/preview', upload.single('file'), (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const preferredSheet = req.body.sheetName as string | undefined;
    const inspection = inspectFile(req.file.buffer, req.file.originalname, preferredSheet);

    res.json(inspection);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to inspect file' });
  }
});

// 4. Bulk upload & start job
app.post('/api/v1/validate/bulk', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const emailColumn = (req.body.emailColumn as string) || '';
    const sheetName = req.body.sheetName as string | undefined;

    if (!emailColumn) {
      res.status(400).json({ error: 'emailColumn parameter is required' });
      return;
    }

    const job = await createAndRunBulkJob(
      req.file.buffer,
      req.file.originalname,
      emailColumn,
      sheetName
    );

    USAGE_STATE.creditsUsed += job.totalRows;

    res.status(202).json({
      jobId: job.id,
      originalFilename: job.originalFilename,
      fileType: job.fileType,
      sheetName: job.sheetName,
      totalRows: job.totalRows,
      status: job.status,
      message: 'Validation job started successfully',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to start bulk validation job' });
  }
});

// 5. Get job status
app.get('/api/v1/jobs/:job_id', (req: Request, res: Response) => {
  const job = getJob(req.params.job_id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const { rows, ...jobSummary } = job;
  res.json(jobSummary);
});

// 6. Get paginated job results
app.get('/api/v1/jobs/:job_id/results', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const pageSize = parseInt(req.query.pageSize as string || '20', 10);
  const search = (req.query.search as string) || '';
  const statusFilter = (req.query.status as string) || 'ALL';
  const sortBy = (req.query.sortBy as string) || 'rowNumber';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

  const results = getJobResults(req.params.job_id, {
    page,
    pageSize,
    search,
    statusFilter,
    sortBy,
    sortOrder,
  });

  if (!results) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json(results);
});

// 7. Cancel job
app.post('/api/v1/jobs/:job_id/cancel', (req: Request, res: Response) => {
  const success = cancelJob(req.params.job_id);
  if (!success) {
    res.status(400).json({ error: 'Could not cancel job or job is already finished' });
    return;
  }
  res.json({ message: 'Job cancelled successfully' });
});

// 8. Download Excel report
app.get('/api/v1/jobs/:job_id/export.xlsx', (req: Request, res: Response) => {
  const job = getJob(req.params.job_id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const statusFilter = (req.query.status as string) || 'ALL';
  const buffer = generateExcelExport(job, statusFilter);
  const safeName = job.originalFilename.replace(/[^a-zA-Z0-9_\.-]/g, '_');

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="validated_${safeName}.xlsx"`
  );
  res.send(buffer);
});

// 9. Download CSV report
app.get('/api/v1/jobs/:job_id/export.csv', (req: Request, res: Response) => {
  const job = getJob(req.params.job_id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const statusFilter = (req.query.status as string) || 'ALL';
  const csvContent = generateCsvExport(job, statusFilter);
  const safeName = job.originalFilename.replace(/[^a-zA-Z0-9_\.-]/g, '_');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="validated_${safeName}.csv"`
  );
  res.send(csvContent);
});

// 10. Download filtered results (format = csv | xlsx)
app.get('/api/v1/jobs/:job_id/export', (req: Request, res: Response) => {
  const format = (req.query.format as string || 'csv').toLowerCase();
  const statusFilter = (req.query.status as string) || 'ALL';
  const job = getJob(req.params.job_id);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const safeName = job.originalFilename.replace(/[^a-zA-Z0-9_\.-]/g, '_');

  if (format === 'xlsx' || format === 'excel') {
    const buffer = generateExcelExport(job, statusFilter);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="validated_${safeName}.xlsx"`
    );
    res.send(buffer);
  } else {
    const csvContent = generateCsvExport(job, statusFilter);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="validated_${safeName}.csv"`
    );
    res.send(csvContent);
  }
});

// 11. Validation history
app.get('/api/v1/history', (req: Request, res: Response) => {
  const jobs = listJobs();
  res.json({ jobs, total: jobs.length });
});

// 12. Delete a job
app.delete('/api/v1/jobs/:job_id', (req: Request, res: Response) => {
  const success = deleteJob(req.params.job_id);
  if (!success) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json({ message: 'Job deleted successfully' });
});

// 13. Usage summary
app.get('/api/v1/usage', (req: Request, res: Response) => {
  const jobs = listJobs();
  let totalProcessed = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  let totalRisky = 0;
  let totalUnknown = 0;

  for (const job of jobs) {
    totalProcessed += job.processedRows;
    totalValid += job.validCount;
    totalInvalid += job.invalidCount;
    totalRisky += job.riskyCount;
    totalUnknown += job.unknownCount;
  }

  res.json({
    planId: USAGE_STATE.planId,
    planName: USAGE_STATE.planName,
    creditsLimit: USAGE_STATE.creditsLimit,
    creditsUsed: USAGE_STATE.creditsUsed,
    creditsRemaining: Math.max(0, USAGE_STATE.creditsLimit - USAGE_STATE.creditsUsed),
    resetDate: USAGE_STATE.billingCycleResetDate,
    stats: {
      totalProcessed,
      totalValid,
      totalInvalid,
      totalRisky,
      totalUnknown,
      totalJobs: jobs.length,
    },
  });
});

// 14. Plans & Pricing
app.get('/api/v1/plans', (req: Request, res: Response) => {
  res.json({ plans: PLANS });
});

// Safe Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err.message || err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred during processing',
  });
});

// Mount Vite middleware for dev or serve built files for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EmailCheck Pro SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
