# EmailCheck Pro — REST API Reference (v1)

Base URL: `http://localhost:3000` (or your deployed domain)

All requests and responses use JSON format unless file streaming is specified.

---

### 1. Health Check
`GET /api/health`

Returns operational telemetry and engine readiness status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "EmailCheck Pro Engine",
  "timestamp": "2026-10-15T17:00:00.000Z",
  "uptimeSeconds": 360
}
```

---

### 2. Single Email Validation
`POST /api/v1/validate/single`

**Headers:**
`Content-Type: application/json`

**Body:**
```json
{
  "email": "sarah.connor@cyberdyne.org",
  "treatRoleAsRisky": true
}
```

**Response (200 OK):**
```json
{
  "originalEmail": "sarah.connor@cyberdyne.org",
  "normalizedEmail": "sarah.connor@cyberdyne.org",
  "localPart": "sarah.connor",
  "domain": "cyberdyne.org",
  "status": "VALID",
  "score": 98,
  "comment": "Valid corporate mailbox with verified mail exchange (MX) servers",
  "checks": {
    "syntax": { "valid": true },
    "domain": { "name": "cyberdyne.org", "validSyntax": true, "isIDNA": false },
    "dns": {
      "hasMx": true,
      "hasFallbackA": false,
      "mxRecords": ["mail.cyberdyne.org"],
      "status": "FOUND",
      "responseTimeMs": 14
    },
    "disposable": { "isDisposable": false },
    "roleBased": { "isRoleBased": false },
    "freeProvider": { "isFree": false }
  },
  "validatedAt": "2026-10-15T17:00:00.000Z"
}
```

---

### 3. File Preview & Column Inspection
`POST /api/v1/files/preview`

**Headers:** `Content-Type: multipart/form-data`
**Form Fields:**
- `file`: Spreadsheet file (`.csv`, `.xlsx`, `.xls`)
- `sheetName`: (Optional) Excel worksheet name

**Response (200 OK):**
```json
{
  "filename": "leads_q4.csv",
  "fileType": "csv",
  "sheets": ["Sheet1"],
  "activeSheet": "Sheet1",
  "headers": ["first_name", "last_name", "email", "company"],
  "previewRows": [ ... ],
  "totalRowsEstimated": 500,
  "detectedEmailColumn": "email"
}
```

---

### 4. Bulk Upload & Validation Job Start
`POST /api/v1/validate/bulk`

**Headers:** `Content-Type: multipart/form-data`
**Form Fields:**
- `file`: Spreadsheet file (`.csv`, `.xlsx`, `.xls`)
- `emailColumn`: Name of column containing email addresses
- `sheetName`: (Optional) Target worksheet name

**Response (202 Accepted):**
```json
{
  "jobId": "60cc4f07-60b5-467b-b7a6-6acce083ec13",
  "originalFilename": "leads_q4.csv",
  "fileType": "csv",
  "totalRows": 500,
  "status": "PROCESSING",
  "message": "Validation job started successfully"
}
```

---

### 5. Job Status & Summary
`GET /api/v1/jobs/{job_id}`

**Response (200 OK):**
```json
{
  "id": "60cc4f07-60b5-467b-b7a6-6acce083ec13",
  "originalFilename": "leads_q4.csv",
  "fileType": "csv",
  "emailColumn": "email",
  "totalRows": 500,
  "processedRows": 500,
  "validCount": 420,
  "invalidCount": 50,
  "riskyCount": 25,
  "unknownCount": 5,
  "status": "COMPLETED",
  "progressPercent": 100,
  "createdAt": "2026-10-15T17:00:00.000Z"
}
```

---

### 6. Paginated Job Results
`GET /api/v1/jobs/{job_id}/results?page=1&pageSize=20&status=ALL&search=smith`

---

### 7. Export Downloads
- Excel: `GET /api/v1/jobs/{job_id}/export.xlsx?status=ALL`
- CSV: `GET /api/v1/jobs/{job_id}/export.csv?status=ALL`
- Filtered: `GET /api/v1/jobs/{job_id}/export?format=csv&status=INVALID`
