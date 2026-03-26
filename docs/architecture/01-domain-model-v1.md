# Domain Model V1

## Core Entities
- `users`: authenticated users
- `auth_sessions`: browser sessions
- `interest_profiles`: user-defined matching profiles
- `interest_examples`: positive example notice documents
- `announcements`: KEIT announcement master records
- `announcement_details`: detail page provenance
- `attachments`: attachment metadata and local path
- `documents`: extracted/normalized notice documents
- `announcement_embeddings`: vector for each processed notice
- `profile_embeddings`: vector for each interest profile description
- `scores`: scoring results per profile x announcement
- `notifications`: in-app alerts shown to users

## Core Relationships
- one user -> many interest profiles
- one profile -> many interest examples
- one announcement -> many attachments
- one announcement -> one primary processed document in V1
- one profile x one announcement -> one score per scorer version
- one score can generate one notification
