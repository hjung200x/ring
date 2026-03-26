# ADR 0002 - Tech Stack

## Status
- Accepted / 2026-03-25

## Choices

### Common
- TypeScript 5.x
- pnpm workspace
- Node.js 20 LTS
- Vitest

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- TanStack Query

### Backend
- Fastify
- Prisma
- PostgreSQL + pgvector
- Session + HttpOnly cookie auth
- Scheduled jobs inside API app for V1
- Local filesystem storage for downloaded files

### Extraction
- Python helper scripts
- `hwp5` for `.hwp`
- zip/xml parsing for `.hwpx`

## Deferred / Avoided in V1
- Docker-first deployment
- Microservice split
- Direct LLM dependency in scoring
- SQLite as primary DB
