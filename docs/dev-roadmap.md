# ring Development Roadmap V1

## Overview
- Total modules: 15
- Current completed: 1 / 15
- V1 goal: collect KEIT notices, score them against user interests, and surface matched notifications in the authenticated web app.

## Phase Structure
| Phase | Name | Description | Module count |
|-------|------|------|---------|
| Phase 0 | Bootstrap | repo skeleton, shared config, app bootstrap | 3 |
| Phase 1 | Data foundation | schema, auth, profile CRUD | 4 |
| Phase 2 | Collection pipeline | collector, attachment selection, extraction, normalization | 3 |
| Phase 3 | Matching pipeline | embeddings, scoring, notification creation | 3 |
| Phase 4 | User web UX | notification UI and profile UI | 2 |

## Phase 0 - Bootstrap
| ID | Module | Description | Area | Depends on | Size | Status |
|----|--------|------|--------|------|--------|------|
| M-001 | Architecture docs | ADR and architecture baseline | Docs | none | XS | done |
| M-002 | Monorepo skeleton | `apps/api`, `apps/web`, `packages/*`, base scripts | Env | M-001 | S | todo |
| M-003 | App bootstrap | Fastify app shell, React shell, env/config loading | Env | M-002 | S | todo |

## Phase 1 - Data foundation
| ID | Module | Description | Area | Depends on | Size | Status |
|----|--------|------|--------|------|--------|------|
| M-101 | Prisma schema | users, sessions, profiles, announcements, docs, scores, notifications | DB | M-003 | M | todo |
| M-102 | Session auth | login/logout/me, cookie session, auth guard | API | M-101 | M | todo |
| M-103 | Profile CRUD | profile create/update/list/detail | API | M-102 | M | todo |
| M-104 | Example management | add/remove examples from announcement, upload, manual text | API | M-103 | M | todo |

## Phase 2 - Collection pipeline
| ID | Module | Description | Area | Depends on | Size | Status |
|----|--------|------|--------|------|--------|------|
| M-201 | KEIT collector | list/detail parsing and persistence | Ingest | M-101 | M | todo |
| M-202 | Attachment selector/downloader | primary notice selection and file persistence | Ingest | M-201 | M | todo |
| M-203 | Notice extraction | `hwp`/`hwpx` extraction, normalization, summary | Ingest | M-202 | M | todo |

## Phase 3 - Matching pipeline
| ID | Module | Description | Area | Depends on | Size | Status |
|----|--------|------|--------|------|--------|------|
| M-301 | Embedding pipeline | profile/example/announcement embeddings | Matching | M-104, M-203 | M | todo |
| M-302 | Similarity scorer | keyword prefilter, score calc, threshold decision | Matching | M-301 | M | todo |
| M-303 | Notification generator | dedupe, creation, read state support | Domain | M-302 | S | todo |

## Phase 4 - User web UX
| ID | Module | Description | Area | Depends on | Size | Status |
|----|--------|------|--------|------|--------|------|
| M-401 | Notification pages | login-protected list/detail UI | Web | M-303 | M | todo |
| M-402 | Profile pages | profile CRUD and example management UI | Web | M-104, M-401 | M | todo |

## Dependency Diagram
```text
M-001
  -> M-002
      -> M-003
          -> M-101
              -> M-102 -> M-103 -> M-104
              -> M-201 -> M-202 -> M-203 -> M-301 -> M-302 -> M-303 -> M-401 -> M-402
```

## Execution Policy
- do not start dependent modules before prerequisites finish
- tests first, implementation second, roadmap update last
- keep scope inside ADR 0001 V1 boundaries
