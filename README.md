# DevBoard API

> Production-grade REST + WebSocket API for DevBoard — a full-stack team collaboration platform.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![CI](https://github.com/DevBoardsVerse/devboards-api/actions/workflows/ci.yml/badge.svg)](https://github.com/DevBoardsVerse/devboards-api/actions)

## Live Demo

| | |
|---|---|
| **Frontend** | https://devboard-web-sigma.vercel.app |
| **API Docs (Swagger)** | https://devboards-api.onrender.com/api/docs |
| **Demo Email** | `demo@devboard.app` |
| **Demo Password** | `Demo@1234` |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL + TypeORM |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| Auth | JWT access tokens + refresh token rotation |
| Storage | MinIO (dev) / Cloudflare R2 (prod) |
| Email | Brevo (transactional) |
| Realtime | Socket.io WebSocket gateway |
| AI | Groq API (Llama 3.1 8B) |
| Docs | Swagger / OpenAPI |
| Deploy | Render + Docker |
| CI | GitHub Actions |

## Features

- **JWT Authentication** — access tokens (15min) + refresh token rotation (7d) with reuse detection, tokens hashed with bcrypt and stored in Redis
- **Role-based access control** — global roles (admin/member) + org-level roles (owner/admin/member/viewer) with privilege escalation prevention
- **Organizations** — CRUD, soft delete, membership system with invite by email
- **Projects** — scoped to organizations, full CRUD
- **Tasks** — status/priority enums, assignment, filtering, pagination, soft delete, drag-and-drop status updates
- **Real-time updates** — Socket.io gateway, org rooms, live task and activity events
- **File attachments** — MinIO locally, Cloudflare R2 in production via S3 SDK
- **Activity log** — immutable audit trail with JSONB metadata
- **Email notifications** — invite and task assignment emails via BullMQ queue + Brevo
- **Redis caching** — cache-aside pattern on activity feed and member list with write-through invalidation
- **Rate limiting** — 100/min global, 10/min auth, 5/min register
- - **AI task suggestions** — `/ai/suggest-task` endpoint generates task descriptions and suggests priority using Groq API (Llama 3.1 8B Instant), free with no credit card required
- **Security** — Helmet headers, CORS locked to allowed origins, bcrypt password hashing

## Architecture

```
┌─────────────────────────────────────────┐
│           Client (Next.js)              │
│         Vercel — SSR + CDN              │
└──────────┬──────────────┬───────────────┘
           │ REST API      │ WebSocket
           ▼               ▼
┌──────────────────────────────────────────┐
│         NestJS Backend (Render)          │
├──────────────────────────────────────────┤
│  PostgreSQL  │  Redis (Upstash)          │
│  (NeonDB)    │  Cache + BullMQ queue     │
└──────────────┴──────────────────────────┘
```

## API Structure
POST   /auth/register|login|refresh|logout
GET    /users/me
CRUD   /organizations
GET    /organizations/:id/members
POST   /organizations/:id/members/invite
PATCH  /organizations/:id/members/:userId/role
DELETE /organizations/:id/members/:userId
CRUD   /organizations/:id/projects
CRUD   /organizations/:id/projects/:id/tasks
PATCH  /organizations/:id/projects/:id/tasks/:id/assign
POST   /organizations/:id/projects/:id/tasks/:id/attachments
GET    /organizations/:id/activity
GET    /health
POST   /ai/suggest-task

## Local Setup

### Prerequisites
- Node.js 18+
- Docker + Docker Compose

### Steps

```bash
# Clone the repo
git clone https://github.com/DevBoardsVerse/devboards-api.git
cd devboards-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your values

# Start infrastructure (Postgres, Redis, MinIO)
docker-compose up -d

# Run migrations
npm run migration:run

# Seed demo data
npm run seed

# Start dev server
npm run start:dev
```

### Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=devboard_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USER=your-brevo-user
MAIL_PASS=your-brevo-key
MAIL_FROM=noreply@devboard.app

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

FRONTEND_URL=http://localhost:3001
```

## CI/CD

GitHub Actions runs on every push:
- TypeScript type check
- Production build

Render auto-deploys on push to `main`.

---

Built by [Swapnil Jadhav](https://github.com/DevBoardsVerse) 
