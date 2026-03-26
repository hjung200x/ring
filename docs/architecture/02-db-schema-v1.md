# DB Schema V1

## Key Tables

### users
- id UUID PK
- email unique
- password_hash
- name
- phone_number nullable
- kakao_target nullable
- is_active
- created_at
- updated_at

### auth_sessions
- id UUID PK
- user_id FK users.id
- session_token_hash unique
- expires_at
- created_at
- updated_at

### interest_profiles
- id UUID PK
- user_id FK users.id
- name
- description text
- include_keywords_json jsonb
- exclude_keywords_json jsonb
- similarity_threshold decimal(4,3)
- enabled boolean
- created_at
- updated_at

### interest_examples
- id UUID PK
- profile_id FK interest_profiles.id
- source_type `announcement|upload|manual_text`
- source_ref nullable
- title
- raw_text
- normalized_text
- attachment_path nullable
- embedding vector nullable
- embedding_model nullable
- created_at
- updated_at

### announcements
- id UUID PK
- source `keit`
- source_ancm_id
- source_bsns_yy
- program_id
- title
- status_text nullable
- posted_at nullable
- apply_start_at nullable
- apply_end_at nullable
- detail_url
- created_at
- updated_at
- unique(source, source_ancm_id, source_bsns_yy)

### announcement_details
- id UUID PK
- announcement_id FK announcements.id
- raw_html_path nullable
- source_payload_json jsonb
- created_at
- updated_at

### attachments
- id UUID PK
- announcement_id FK announcements.id
- filename
- extension
- atch_doc_id
- atch_file_id
- local_path nullable
- is_primary_notice_doc boolean
- downloaded_at nullable
- created_at
- updated_at

### documents
- id UUID PK
- announcement_id FK announcements.id
- attachment_id FK attachments.id unique
- doc_type `hwp|hwpx`
- extraction_status `pending|success|failed`
- extraction_error nullable
- raw_text nullable
- normalized_text nullable
- summary_text nullable
- text_hash nullable
- created_at
- updated_at

### announcement_embeddings
- id UUID PK
- announcement_id FK announcements.id unique
- embedding_model
- source_text
- embedding vector
- created_at

### profile_embeddings
- id UUID PK
- profile_id FK interest_profiles.id unique
- embedding_model
- source_text
- embedding vector
- created_at
- updated_at

### scores
- id UUID PK
- announcement_id FK announcements.id
- profile_id FK interest_profiles.id
- keyword_pass boolean
- keyword_hits_json jsonb
- exclude_hits_json jsonb
- profile_similarity nullable
- example_max_similarity nullable
- example_avg_similarity nullable
- final_score nullable
- scorer_version
- created_at
- unique(profile_id, announcement_id, scorer_version)

### notifications
- id UUID PK
- user_id FK users.id
- profile_id FK interest_profiles.id
- announcement_id FK announcements.id
- score_id FK scores.id
- title
- summary
- reason_json jsonb
- status `created|delivered|failed`
- is_read boolean
- read_at nullable
- channel_type default `in_app`
- delivered_at nullable
- dedupe_key unique
- created_at
- updated_at
