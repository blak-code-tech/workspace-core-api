# Audit Logs API Documentation

## Overview

The Audit Logs system automatically tracks all user actions across the workspace API, including authentication, team management, project management, and document operations.

## Tracked Actions

### Authentication

- `SIGN_IN` - User signs in
- `SIGN_UP` - User creates account
- `SIGN_OUT` - User signs out
- `REFRESH_TOKEN` - User refreshes authentication token

### Team Management

- `CREATE_TEAM` - Team is created
- `UPDATE_TEAM` - Team details are updated
- `DELETE_TEAM` - Team is deleted
- `ADD_TEAM_MEMBER` - Member is added to team
- `REMOVE_TEAM_MEMBER` - Member is removed from team
- `UPDATE_TEAM_MEMBER_ROLE` - Team member role is changed

### Project Management

- `CREATE_PROJECT` - Project is created
- `UPDATE_PROJECT` - Project details are updated
- `DELETE_PROJECT` - Project is deleted
- `ADD_PROJECT_MEMBER` - Member is added to project
- `REMOVE_PROJECT_MEMBER` - Member is removed from project
- `UPDATE_PROJECT_MEMBER_ROLE` - Project member role is changed

### Document Management

- `CREATE_DOCUMENT` - Document is created
- `UPDATE_DOCUMENT` - Document is updated
- `DELETE_DOCUMENT` - Document is deleted
- `VIEW_DOCUMENT` - Document is viewed

### User Management

- `UPDATE_USER` - User profile is updated
- `DELETE_USER` - User account is deleted

## API Endpoints

### 1. Create Audit Log (Admin Only)

**POST** `/audit-logs`

Manually create an audit log entry.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "userId": "user-uuid",
  "action": "CREATE_TEAM",
  "entityType": "Team",
  "entityId": "team-uuid",
  "ipAddress": "192.168.1.1",
  "meta": {
    "teamName": "Engineering Team",
    "additionalInfo": "any additional context"
  }
}
```

**Response:**

```json
{
  "id": "audit-log-uuid",
  "userId": "user-uuid",
  "action": "CREATE_TEAM",
  "entityType": "Team",
  "entityId": "team-uuid",
  "ipAddress": "192.168.1.1",
  "meta": { ... },
  "createdAt": "2026-01-05T12:00:00.000Z",
  "updatedAt": "2026-01-05T12:00:00.000Z"
}
```

---

### 2. Get All Audit Logs (Admin Only)

**GET** `/audit-logs`

Retrieve all audit logs with optional filtering and pagination.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `userId` (optional) - Filter by user ID
- `action` (optional) - Filter by action type
- `entityType` (optional) - Filter by entity type (Team, Project, Document, User)
- `entityId` (optional) - Filter by entity ID
- `startDate` (optional) - Filter logs from this date (ISO 8601)
- `endDate` (optional) - Filter logs until this date (ISO 8601)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page

**Example Request:**

```
GET /audit-logs?action=CREATE_TEAM&page=1&limit=20&startDate=2026-01-01T00:00:00.000Z
```

**Response:**

```json
{
  "data": [
    {
      "id": "audit-log-uuid",
      "userId": "user-uuid",
      "action": "CREATE_TEAM",
      "entityType": "Team",
      "entityId": "team-uuid",
      "ipAddress": "192.168.1.1",
      "meta": { ... },
      "createdAt": "2026-01-05T12:00:00.000Z",
      "updatedAt": "2026-01-05T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### 3. Get User's Audit Logs

**GET** `/audit-logs/user/:userId`

Retrieve audit logs for a specific user. Users can view their own logs, admins can view any user's logs.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**
Same as "Get All Audit Logs" (except userId is in the path)

**Example Request:**

```
GET /audit-logs/user/user-uuid-123?page=1&limit=50
```

**Response:**
Same structure as "Get All Audit Logs"

---

### 4. Get Audit Log Statistics (Admin Only)

**GET** `/audit-logs/stats`

Get statistics about audit logs, including total count and breakdown by action type.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `userId` (optional) - Filter statistics by user ID
- `startDate` (optional) - Filter from this date (ISO 8601)
- `endDate` (optional) - Filter until this date (ISO 8601)

**Example Request:**

```
GET /audit-logs/stats?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z
```

**Response:**

```json
{
  "total": 1523,
  "actionStats": {
    "SIGN_IN": 342,
    "CREATE_TEAM": 45,
    "CREATE_PROJECT": 78,
    "CREATE_DOCUMENT": 234,
    "UPDATE_DOCUMENT": 456,
    "ADD_TEAM_MEMBER": 89,
    "ADD_PROJECT_MEMBER": 123,
    "VIEW_DOCUMENT": 156
  }
}
```

---

## Automatic Logging

All actions are automatically logged via the `AuditLogInterceptor`. The interceptor:

1. **Captures metadata** including:
   - User ID from JWT token
   - Action type (determined from route and HTTP method)
   - Entity type and ID (extracted from response)
   - IP address
   - User agent
   - Sanitized request body (sensitive fields redacted)

2. **Logs asynchronously** to avoid blocking API responses

3. **Sanitizes sensitive data** - passwords, tokens, and other sensitive fields are redacted as `[REDACTED]`

4. **Handles errors** - Failed requests are also logged with error information

## Access Control

- **Admin/Super Admin**: Can create logs manually, view all logs, and view statistics
- **Regular Users**: Can only view their own audit logs via `/audit-logs/user/:userId`

## Example Use Cases

### 1. Track User Activity

```bash
# Get all actions by a specific user in the last 7 days
GET /audit-logs/user/user-uuid?startDate=2026-01-01T00:00:00.000Z
```

### 2. Monitor Team Changes

```bash
# Get all team-related actions
GET /audit-logs?entityType=Team&page=1&limit=50
```

### 3. Audit Document Access

```bash
# Get all document views
GET /audit-logs?action=VIEW_DOCUMENT&startDate=2026-01-01T00:00:00.000Z
```

### 4. Security Monitoring

```bash
# Get login statistics for the month
GET /audit-logs/stats?startDate=2026-01-01T00:00:00.000Z&endDate=2026-01-31T23:59:59.999Z
```

### 5. Compliance Reporting

```bash
# Get all actions for compliance audit
GET /audit-logs?startDate=2025-01-01T00:00:00.000Z&endDate=2025-12-31T23:59:59.999Z&limit=1000
```

## Database Schema

```prisma
model AuditLog {
  id         String    @id @default(uuid())
  userId     String
  action     String
  entityType String?
  entityId   String?
  ipAddress  String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  meta       Json?

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([entityType, entityId])
}
```

## Notes

- Audit logs are **append-only** - there are no update or delete endpoints
- All timestamps are in UTC
- The `meta` field can contain any additional context as JSON
- Pagination is recommended for large result sets
- Indexes are optimized for common query patterns
