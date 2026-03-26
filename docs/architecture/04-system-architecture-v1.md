# System Architecture V1

## Overall Structure
```text
Browser (React Web App)
  -> HTTP / JSON
API Server (Fastify)
  -> Prisma
PostgreSQL + pgvector

API Server
  -> collector jobs
  -> document jobs
  -> scoring jobs
  -> local file storage
  -> Python extraction bridge
```

## Main Components
- web app: login, profiles, notifications
- api server: auth, profile CRUD, notification APIs, internal jobs
- collector module: KEIT list/detail/attachment collection
- documents module: download, extract, normalize, summarize
- embeddings module: vector generation and similarity helpers
- matching module: keyword filter and scoring
- notifications module: notification creation/read APIs
