# ADR 0003 - Interest Storage Strategy

## Status
- Accepted / 2026-03-25

## Decision
User interest is stored in three layers.

1. Description
- Free-text explanation of the user's target notice type.
- Used to generate a profile embedding.

2. Include / exclude keywords
- Stored as JSON arrays.
- Used by prefiltering and explanation.

3. Positive examples
- Interest examples selected from collected announcements, uploaded files, or pasted text.
- Stored with normalized text and embedding.

## Why
- Description handles cold start.
- Keywords give direct control and quick filtering.
- Examples improve precision with concrete similarity anchors.

## Input UX
- Profile name
- Description text
- Include keyword chips
- Exclude keyword chips
- Similarity threshold
- Example add methods: from announcement, upload, manual text

## V1 Rule
No negative-example learning in V1. Keep the model simple: description + keywords + positive examples.
