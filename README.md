# EmailCheck Pro — Complete Email Validation SaaS Platform (v1)

EmailCheck Pro is an enterprise-grade deliverability analysis and email verification SaaS platform. It protects sender reputation by verifying email syntax, querying authoritative DNS and Mail Exchanger (MX) records, identifying disposable/burner mailboxes, flagging role-based addresses, detecting duplicate records in bulk lists, and safely exporting verified datasets with CSV formula-injection defense.

---

## Key Features

1. **Single Email Validation Engine**:
   - RFC 5322 compliance check (local-part bounds $\le 64$, total length $\le 254$, no consecutive dots).
   - Domain normalization and Internationalized Domain Names (IDNA) punycode resolution.
   - Authoritative DNS queries for MX records with implicit A/AAAA mail-routing fallback.
   - In-memory DNS cache with TTL to eliminate redundant queries.
   - 350+ disposable and temporary mailbox domain blacklist detection.
   - Role-based address identification (`admin@`, `support@`, `sales@`, `billing@`, etc.).
   - Transparent 0–100 quality confidence score with granular explanation rationale.

2. **Bulk Spreadsheet Verification (.csv, .xlsx, .xls)**:
   - Drag-and-drop file upload with 10 MB and up to 10,000 rows limit.
   - Instant file preview showing the first 10 rows and estimated total rows.
   - Multi-sheet Excel workbook support with interactive sheet selection.
   - Automatic email column detection (or manual override).
   - Full data preservation: preserves all original columns and row ordering intact.
   - In-file duplicate address detection (flags duplicates and references first row).
   - Bounded async batch processing with cancellation support.
   - Real-time progress tracking (processed rows, percentages, valid/invalid/risky breakdown).

3. **Safe Spreadsheet Exports**:
   - Download complete Microsoft Excel (`.xlsx`) workbooks.
   - Download formatted `.csv` reports.
   - Filtered downloads: export Invalid rows only or Risky rows only.
   - **Spreadsheet Formula Injection Defense**: Safely prepends an apostrophe (`'`) to any cell starting with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) to neutralize DDE attacks in Microsoft Excel and LibreOffice.

4. **Deliverability Dashboard & Analytics**:
   - KPI metrics: Total emails processed, Valid format, Invalid bounces, Risky/Role, Unknown.
   - Visualizations via Recharts (Donut chart for status ratios, Area chart for throughput over time).
   - Quick single-validation widget directly on the dashboard.
   - Recent batch jobs ledger with instant download links.

5. **Validation History & Audit Ledger**:
   - History table tracking Job ID, filename, upload timestamp, row counts, and status.
   - Direct download actions for `.xlsx` and `.csv`.
   - Inspection modal and permanent job deletion with confirmation dialog.

6. **Pricing & Subscription Architecture**:
   - Free Community, Starter Pro, and Business Scale plans.
   - Monthly and annual billing toggle with 20% savings badge.
   - Usage credits tracker with sandbox checkout modal.

7. **Platform Settings & Documentation**:
   - Configurable export formats, role strictness, and DNS timeouts.
   - Automated data retention preferences (7, 30, 90 days, or immediate wipe).
   - REST API token generator for automation.
   - Technical documentation explaining DNS limits and why intrusive SMTP probing is avoided.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Recharts.
- **Full-Stack Runtime**: Node 22, Express, TypeScript (`tsx server.ts`), `xlsx`, `multer`.
- **Backend Architecture (Dual-Ready)**: Python 3.12+ / FastAPI, SQLAlchemy 2, Pydantic, Alembic, `dnspython`, `pandas`, `openpyxl`.
- **Database**: PostgreSQL (with SQLite development fallback).
- **Security**: Formula injection escaping, CORS restriction, safe temporary memory buffers.

---

## Project Folder Structure

```
├── server.ts                     # Full-Stack Express API server + Vite middlewares
├── src/
│   ├── components/
│   │   ├── Navbar.tsx            # Top bar adhering to Top Bar Contract
│   │   └── StatusBadge.tsx       # Standardized status badges and score gauges
│   ├── pages/
│   │   ├── Dashboard.tsx         # Analytics charts, KPI cards, recent jobs
│   │   ├── SingleValidator.tsx   # Interactive email tester with presets and RFC checks
│   │   ├── BulkValidator.tsx     # File drop, preview, column select, table, exports
│   │   ├── ValidationHistory.tsx # Audit ledger, report downloads, job deletion
│   │   ├── Pricing.tsx           # Subscription plans, monthly/annual toggle, checkout
│   │   ├── Settings.tsx          # Export preferences, retention, API tokens
│   │   └── Documentation.tsx     # Technical guide, DNS capabilities, scoring rules
│   ├── server/
│   │   ├── disposableDomains.ts  # Disposable blacklist & role prefixes
│   │   ├── validationEngine.ts   # Core single validation, RFC parser, DNS cache
│   │   └── bulkProcessor.ts      # Excel/CSV parser, batch runner, formula-safe exports
│   ├── types/index.ts            # TypeScript interface declarations
│   ├── App.tsx                   # Master routing and SaaS state
│   ├── index.css                 # Tailwind CSS v4 styles & custom typography
│   └── main.tsx                  # React DOM entry point
├── backend/
│   ├── app/
│   │   ├── api/routes/           # FastAPI routers
│   │   ├── core/config.py        # Settings & environment variables
│   │   ├── db/models.py          # SQLAlchemy PostgreSQL models (users, jobs, plans, etc.)
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # Python validation engine & DNS resolver
│   │   └── main.py               # FastAPI application entry point
│   ├── tests/test_validation.py  # Pytest automated test suite
│   └── requirements.txt          # Python dependencies
├── sample_data/
│   └── sample_emails.csv         # Sample dataset with valid, invalid, risky, and duplicate emails
├── docs/
│   ├── API.md                    # Detailed REST API specification
│   ├── VALIDATION_RULES.md       # Validation engine & scoring documentation
│   └── DEPLOYMENT.md             # Production hosting & Docker guide
├── docker-compose.yml            # Container orchestration for App + PostgreSQL
├── Dockerfile                    # Production container build
├── .env.example                  # Environment configuration template
└── README.md
```

---

## Quickstart & Local Execution

### 1. Run the Full-Stack Application
```bash
npm install
npm run dev
```
The application will launch on `http://localhost:3000` with the complete interactive frontend and full REST API backend active!

### 2. Run with Docker Compose
```bash
docker-compose up --build -d
```

### 3. Verify Health Endpoint
```bash
curl http://localhost:3000/api/health
```

---

## REST API Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health and engine uptime status |
| `POST` | `/api/v1/validate/single` | Validate single email address |
| `POST` | `/api/v1/files/preview` | Upload and preview spreadsheet headers & rows |
| `POST` | `/api/v1/validate/bulk` | Launch asynchronous bulk verification job |
| `GET` | `/api/v1/jobs/:job_id` | Check job progress, statistics, and state |
| `GET` | `/api/v1/jobs/:job_id/results` | Fetch paginated, filtered, and sorted results |
| `POST` | `/api/v1/jobs/:job_id/cancel` | Cancel an in-flight batch job |
| `GET` | `/api/v1/jobs/:job_id/export.xlsx`| Download verified Excel report |
| `GET` | `/api/v1/jobs/:job_id/export.csv` | Download verified CSV report |
| `GET` | `/api/v1/history` | List previous validation jobs |
| `DELETE` | `/api/v1/jobs/:job_id` | Permanently delete job and records |
| `GET` | `/api/v1/usage` | Get plan usage and credit quotas |
| `GET` | `/api/v1/plans` | List available subscription tiers |

---

## Security & Data Privacy

- **Safe Formula Escaping**: Untrusted CSV/Excel content starting with `=`, `+`, `-`, `@`, `\t`, `\r` is escaped with `'`.
- **Zero-Storage Promise**: Uploaded spreadsheets are processed in memory and deleted according to retention policy.
- **No Intrusive SMTP Probing**: Does not trigger recipient spam traps, greylisting, or IP blacklists.
