# ExamSetu AI

**AI-Augmented On-Screen Marking & Evaluation Platform**

> _AI suggests, the human decides, the system records everything._

ExamSetu AI is an intelligent evaluation ecosystem for university-scale examinations. It adds an AI intelligence layer on top of traditional On-Screen Marking (OSM) — assisting judgment with reading support, scoring suggestions, anomaly detection, moderation, and analytics — while keeping the human examiner in final control of every mark.

## Architecture

```
├── backend/          FastAPI application (Python 3.12)
│   ├── app/
│   │   ├── core/         Configuration, security, events, errors
│   │   ├── db/           SQLAlchemy models, sessions, migrations
│   │   ├── integrations/ Firebase, Gemini, Groq, R2, Redis
│   │   ├── modules/      13 domain modules (auth, users, exams, ...)
│   │   └── workers/      ARQ background job handlers
│   └── Dockerfile
│
├── web/              Next.js frontend (TypeScript)
│   ├── app/
│   │   ├── (examiner)/   Examiner evaluation workspace
│   │   ├── (controller)/ Dashboard, analytics, moderation
│   │   └── (admin)/      User, exam, and system management
│   ├── components/       shadcn/ui + shared components
│   ├── features/         Feature-specific components
│   └── lib/              Auth, API client, realtime, utilities
│
└── Skills/           Design documents (PRD, backend, frontend, techstack)
```

## Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS 4, shadcn/ui, TanStack Query, Recharts
- **Backend:** FastAPI, SQLAlchemy 2.0, ARQ, Gemini SDK, Groq SDK
- **Database:** Neon Postgres
- **Storage:** Cloudflare R2
- **Auth:** Firebase Auth
- **Real-time:** Server-Sent Events (SSE)

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env    # Fill in your credentials
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

### Frontend
```bash
cd web
cp .env.example .env.local    # Fill in your Firebase config
npm install
npm run dev
```

## License

Proprietary — MPOnline Idea & Innovation Hackathon 2026
