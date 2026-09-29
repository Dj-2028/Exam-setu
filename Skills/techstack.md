# Technology Stack

## ExamSetu AI: Intelligent On-Screen Marking & Evaluation Ecosystem

|                       |                                                |
| --------------------- | ---------------------------------------------- |
| **Document status**   | Draft v1.0                                     |
| **Date**              | 30 September 2026                              |
| **Related documents** | PRD.md, backend.md, frontend.md, database.md   |

This file is the **single source of truth** for every technology choice in
ExamSetu AI. Other documents reference it but do not repeat stack details.

---

## 1. Frontend

| Layer               | Technology                    | Version / Notes                                      |
| ------------------- | ----------------------------- | ---------------------------------------------------- |
| **Framework**        | Next.js (App Router)          | 15.x, React 19, TypeScript                           |
| **Styling**          | Tailwind CSS                  | 4.x with `@theme inline` tokens                      |
| **Component library**| shadcn/ui                     | Radix UI primitives + Tailwind, copy-paste model      |
| **Server state**     | TanStack Query (React Query)  | 5.x, cache, refetch, invalidation                    |
| **Charts**           | Recharts                      | Theme-aware via CSS variables                        |
| **Internationalization** | next-intl                 | English and Hindi; JSON message files                |
| **Theming**          | next-themes                   | Light / Dark / System; `dark` class on `<html>`      |
| **Auth (client)**    | Firebase Auth (JS SDK)        | Email/password; token passed as Bearer               |
| **Forms**            | React Hook Form + Zod         | Schema-first validation                              |
| **UI state**         | Zustand                       | Small stores for viewer, preferences                 |
| **Real-time**        | SSE (native EventSource)      | Single connection per session; reconnect with backoff |
| **Fonts**            | Inter + Noto Sans Devanagari  | Loaded via `next/font`                               |
| **API client**       | Generated from OpenAPI spec   | TypeScript types shared with backend                 |
| **Testing**          | Vitest + Playwright           | Unit/component + E2E + visual regression             |

## 2. Backend

| Layer               | Technology                    | Version / Notes                                      |
| ------------------- | ----------------------------- | ---------------------------------------------------- |
| **Framework**        | FastAPI                       | Python 3.12, async, OpenAPI auto-generated           |
| **ORM**              | SQLAlchemy                    | 2.0, async sessions, declarative models              |
| **Migrations**       | Alembic                       | One migration per change, reversible                 |
| **Settings**         | pydantic-settings             | Typed config from environment                        |
| **Background jobs**  | ARQ                           | Redis-backed async worker, retries, scheduled jobs   |
| **Auth (server)**    | Firebase Admin SDK            | Token verification, custom claims, user management   |
| **AI — Vision/OCR**  | Google Gemini SDK             | Handwriting reading, diagram checks (multimodal)     |
| **AI — Text/LLM**    | Groq SDK                      | Score suggestions, summaries (fast inference)        |
| **Object storage**   | Cloudflare R2 (S3-compatible)| Scans, page images, exports; via boto3               |
| **Cache / Pub-Sub**  | Redis                         | Job queues (ARQ), SSE fan-out, dashboard cache       |
| **PDF processing**   | PyMuPDF (fitz)                | PDF → page images                                    |
| **Image processing** | OpenCV + Pillow               | Deskew, denoise, contrast normalization              |
| **OCR fallback**     | Tesseract (pytesseract)       | Fallback when Gemini is unavailable                  |
| **Digital signing**  | Ed25519 (PyNaCl / cryptography)| Audit trail signing, result manifest signing        |
| **Hashing**          | SHA-256 (hashlib)             | Audit chain hashing                                  |
| **Linting**          | Ruff                          | Formatting + linting                                 |
| **Type checking**    | Pyright                       | Strict mode                                          |
| **Testing**          | pytest + pytest-asyncio       | Unit, integration, E2E                               |
| **Dependencies**     | uv                            | Locked, fast installs                                |
| **ASGI server**      | Uvicorn (under Gunicorn)      | Production workers                                   |

## 3. Database

| Component           | Technology                    | Notes                                                |
| ------------------- | ----------------------------- | ---------------------------------------------------- |
| **Primary database** | Neon (Serverless Postgres)   | Branching for dev/staging/prod                       |
| **Connection**       | asyncpg (via SQLAlchemy)     | Async, connection pooling                            |

## 4. Infrastructure & Deployment

| Component           | Technology                    | Notes                                                |
| ------------------- | ----------------------------- | ---------------------------------------------------- |
| **API hosting**      | Render Web Service            | Docker image, auto-deploy from GitHub                |
| **Worker hosting**   | Render Background Worker      | Same Docker image, different entrypoint              |
| **Frontend hosting** | Vercel or Render              | Next.js optimized deployment                         |
| **Container**        | Docker                        | Single image for API + worker                        |
| **CI/CD**            | GitHub Actions                | Lint → type-check → test → build → deploy            |
| **Error tracking**   | Sentry                        | Server-side error capture                            |
| **Environments**     | dev / staging / production    | Separate Neon branch, Firebase project, R2 bucket    |

## 5. Security

| Concern              | Approach                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| **Authentication**   | Firebase Auth (email/password); ID token verified server-side on every request |
| **Authorization**    | Role-based (Examiner, Controller, Admin); enforced in FastAPI policies         |
| **Data in transit**  | HTTPS everywhere                                                               |
| **Data at rest**     | Neon encryption; R2 server-side encryption                                     |
| **Secrets**          | Environment variables / secret storage; never in code or logs                  |
| **Audit integrity**  | SHA-256 hash chain + Ed25519 signatures; append-only                           |
| **Upload safety**    | Content-type validation, size limits, pre-signed URLs                          |
| **AI privacy**       | Only anonymized answer images sent; no student identity to AI providers        |

## 6. Key Design Decisions

| Decision                                    | Rationale                                                            |
| ------------------------------------------- | -------------------------------------------------------------------- |
| Modular monolith (not microservices)         | Simple deployment for hackathon; clean module boundaries for later   |
| Gemini for vision, Groq for text            | Gemini excels at multimodal; Groq provides fast LLM inference        |
| SSE over WebSocket                           | Simpler, sufficient for server→client push, works through proxies    |
| Firebase Auth (not custom)                   | Proven auth with minimal setup; custom claims for roles              |
| Neon Postgres (not Supabase/PlanetScale)     | Serverless Postgres with branching; direct SQL via SQLAlchemy        |
| Cloudflare R2 (not S3/GCS)                   | S3-compatible, no egress fees, cost-effective for scan images        |
| Ed25519 (not RSA)                            | Compact signatures, fast signing, modern standard                    |
| ARQ (not Celery)                             | Lightweight async worker, native asyncio, Redis-backed              |
