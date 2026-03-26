# Notification Flow V1

## Creation
1. Score row is stored for profile x announcement.
2. If final score passes threshold, create one in-app notification.
3. Use dedupe key:
`{userId}:{profileId}:{announcementId}:v1.0.0`

## Detail Payload
- title
- summary
- final score
- include/exclude hit list
- profile similarity
- example max similarity
- source detail URL
- posted/apply period

## Read Flow
- list page shows unread/read state
- opening detail marks notification as read
