# Audit Logs - Quick Reference

## API Endpoints

### Get All Logs (Admin)

```bash
GET /audit-logs?action=SIGN_IN&page=1&limit=50
Authorization: Bearer <admin_token>
```

### Get User's Logs

```bash
GET /audit-logs/user/:userId
Authorization: Bearer <token>
```

### Get Statistics (Admin)

```bash
GET /audit-logs/stats?startDate=2026-01-01T00:00:00.000Z
Authorization: Bearer <admin_token>
```

### Create Log (Admin)

```bash
POST /audit-logs
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "action": "CREATE_TEAM",
  "entityType": "Team",
  "entityId": "team-uuid",
  "ipAddress": "192.168.1.1",
  "meta": { "teamName": "Engineering" }
}
```

## Tracked Actions (26)

**Auth:** SIGN_IN, SIGN_UP, SIGN_OUT, REFRESH_TOKEN

**Teams:** CREATE_TEAM, UPDATE_TEAM, DELETE_TEAM, ADD_TEAM_MEMBER, REMOVE_TEAM_MEMBER, UPDATE_TEAM_MEMBER_ROLE

**Projects:** CREATE_PROJECT, UPDATE_PROJECT, DELETE_PROJECT, ADD_PROJECT_MEMBER, REMOVE_PROJECT_MEMBER, UPDATE_PROJECT_MEMBER_ROLE

**Documents:** CREATE_DOCUMENT, UPDATE_DOCUMENT, DELETE_DOCUMENT, VIEW_DOCUMENT

**Users:** UPDATE_USER, DELETE_USER

## Query Filters

- `userId` - Filter by user
- `action` - Filter by action type
- `entityType` - Filter by entity (Team, Project, Document, User)
- `entityId` - Filter by specific entity
- `startDate` - From date (ISO 8601)
- `endDate` - To date (ISO 8601)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

## Access Control

- **Admin/Super Admin**: Full access to all endpoints
- **Regular Users**: Can only view own logs via `/audit-logs/user/:userId`

## Automatic Logging

All actions are logged automatically via interceptor:

- Captures user ID, action, IP, user agent
- Extracts entity type/ID from response
- Sanitizes sensitive data (passwords → `[REDACTED]`)
- Logs asynchronously (non-blocking)
