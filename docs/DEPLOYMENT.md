# Deployment & Architecture Guide

EmailCheck Pro supports two production architectures:

1. **Full-Stack Node / Express + React (Current Applet Architecture)**:
   - Built on Vite, React 19, TypeScript, and Express.
   - Built with `npm run build` and started with `npm run start` (`tsx server.ts`).
   - Runs out of the box with zero external runtime requirements.

2. **Decoupled Architecture (FastAPI Backend + React SPA Frontend + PostgreSQL)**:
   - Frontend deployed to Vercel, Netlify, or Cloudflare Pages.
   - Backend deployed to Render, Fly.io, Google Cloud Run, or AWS ECS with Python 3.12+ and Uvicorn.
   - Managed PostgreSQL database on Neon, Supabase, or AWS RDS.

---

## Running with Docker Compose

```bash
docker-compose up --build -d
```

This starts:
- Frontend on `http://localhost:3000`
- FastAPI backend on `http://localhost:8000`
- PostgreSQL on `localhost:5432`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Web server listening port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `MAX_UPLOAD_SIZE_MB` | Maximum file upload size in MB | `10` |
| `MAX_UPLOAD_ROWS` | Maximum rows allowed per bulk batch | `10000` |
| `DNS_TIMEOUT_SECONDS` | Timeout for authoritative DNS queries | `2.5` |
| `DATA_RETENTION_DAYS` | Default retention before auto-purge | `30` |
