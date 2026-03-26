# ADR 0001 - Alerting Scope V1

## Status
- Accepted / 2026-03-25

## Background
Users want KEIT R&D announcements filtered to only the notices that match their actual interests. The main signal is usually inside attached `hwp` or `hwpx` notice documents, not just the list title.

## Goals
1. Collect KEIT announcements and extract notice text.
2. Match announcements against stored user interests.
3. Show matched notifications in an authenticated web UI.

## V1 Included
- KEIT list/detail collection
- Primary notice attachment detection and download
- `hwp` / `hwpx` extraction and normalization
- User login and session
- Interest profiles with description, include/exclude keywords, and example notice documents
- Keyword prefilter + embedding similarity scoring
- In-app notification list/detail pages
- Rule-based summary generation

## V1 Excluded
- LLM final decision
- LLM summary generation
- SMS / KakaoTalk outbound delivery
- Non-KEIT sources
- Admin moderation console

## Constraints
- Attachment naming is inconsistent, so primary document selection must be rule-based.
- Matching must work without LLM review in V1.
- Notifications must be explainable via stored evidence.
