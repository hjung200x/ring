# Development Folder Structure V1

```text
apps/
  api/
    src/
      config/
      plugins/
      lib/
      modules/
        auth/
        users/
        interest-profiles/
        announcements/
        collector/
        documents/
        embeddings/
        matching/
        notifications/
        jobs/
      tests/
        helpers/
        factories/
        phase0/
        phase1/
        phase2/
        phase3/
    prisma/
      schema.prisma
      migrations/
    scripts/
      extract_notice.py
      parse_hwp.py
      parse_hwpx.py
  web/
    src/
      pages/
      features/
      components/
      lib/
packages/
  types/
  schemas/
```

## Naming Rules
- TS service/repository/util: kebab-case
- React component/page: PascalCase
- tests: `m-[ID]-[name].test.ts`
- Python scripts: snake_case

## Rules
- no business logic in route handlers
- no scraping logic in web app
- document extraction only through bridge module
