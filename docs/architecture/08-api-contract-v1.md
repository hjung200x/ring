# API Contract V1

## Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

## Profiles
- `GET /api/profiles`
- `POST /api/profiles`
- `GET /api/profiles/:id`
- `PATCH /api/profiles/:id`
- `POST /api/profiles/:id/examples/manual-text`
- `POST /api/profiles/:id/examples/from-announcement`
- `POST /api/profiles/:id/examples/upload`
- `DELETE /api/profiles/:id/examples/:exampleId`

## Notifications
- `GET /api/notifications`
- `GET /api/notifications/:id`
- `POST /api/notifications/:id/read`

## Internal Jobs
- `POST /internal/jobs/collect-announcements`
- `POST /internal/jobs/process-documents`
- `POST /internal/jobs/score-notifications`
