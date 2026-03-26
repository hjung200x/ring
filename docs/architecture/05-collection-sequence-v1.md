# Collection Sequence V1

## Flow
1. Fetch KEIT list pages.
2. Parse title, `ancmId`, `bsnsYy`, status, dates.
3. Upsert announcement rows.
4. For new announcements, fetch detail page.
5. Parse attachments and detail metadata.
6. Select primary notice attachment.
7. Download selected file.
8. Persist attachment metadata and local path.

## Primary Attachment Rule
1. `공고문.(hwp|hwpx)`
2. `재공고.*.(hwp|hwpx)`
3. `공고.*.(hwp|hwpx)`
4. `공모.*.(hwp|hwpx)`
5. fallback to first `hwp|hwpx`
