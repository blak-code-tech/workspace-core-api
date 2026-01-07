# API Pagination Guide

## Overview

All list endpoints in the workspace-core-api use **cursor-based pagination** for optimal performance and scalability. This approach provides consistent query performance regardless of dataset size and prevents duplicate or missing items when data changes between requests.

---

## Why Cursor-Based Pagination?

### Advantages over Offset-Based Pagination

| Feature              | Offset-Based (`page`, `skip`)   | Cursor-Based              |
| -------------------- | ------------------------------- | ------------------------- |
| **Performance**      | Degrades with page depth (O(n)) | Consistent (O(1))         |
| **Scalability**      | Slow for large datasets         | Fast for any dataset size |
| **Data Consistency** | Can show duplicates/skip items  | Stable results            |
| **Real-time Data**   | Poor with frequent updates      | Excellent                 |
| **Database Load**    | Scans all previous rows         | Uses indexes efficiently  |

### Performance Example

```sql
-- Offset-based (page 1000, 20 items/page)
SELECT * FROM projects OFFSET 20000 LIMIT 20;
-- ❌ Database scans 20,020 rows

-- Cursor-based (any page)
SELECT * FROM projects WHERE id < 'cursor' LIMIT 21;
-- ✅ Database scans only 21 rows using index
```

---

## How It Works

### Basic Concept

Instead of using page numbers, cursor pagination uses a **cursor** (an encoded reference to the last item) to fetch the next set of results.

```
┌─────────────────────────────────────────────────────────┐
│ Request 1: GET /projects?limit=10                       │
│ Response: [items 1-10] + endCursor="abc123"            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Request 2: GET /projects?limit=10&cursor=abc123        │
│ Response: [items 11-20] + endCursor="xyz789"           │
└─────────────────────────────────────────────────────────┘
```

### Cursor Encoding

Cursors are **Base64-encoded** for security and to hide internal implementation details:

```typescript
// Internal ID: "550e8400-e29b-41d4-a716-446655440000"
// Encoded cursor: "NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAw"
```

---

## Request Parameters

All paginated endpoints accept these query parameters:

| Parameter | Type   | Required | Default | Max | Description                                 |
| --------- | ------ | -------- | ------- | --- | ------------------------------------------- |
| `cursor`  | string | No       | -       | -   | Cursor from previous response's `endCursor` |
| `limit`   | number | No       | 20      | 100 | Number of items to return                   |

### Example Requests

```http
# First page (no cursor)
GET /projects?teamId=team-123&userId=user-456&limit=20

# Second page (with cursor)
GET /projects?teamId=team-123&userId=user-456&limit=20&cursor=NTUwZTg0MDA...

# Custom page size
GET /projects?teamId=team-123&userId=user-456&limit=50&cursor=NTUwZTg0MDA...
```

---

## Response Structure

All paginated endpoints return a standardized response:

```typescript
{
  data: T[],                    // Array of items
  pageInfo: {
    hasNextPage: boolean,       // True if more items exist
    hasPreviousPage: boolean,   // Currently always false
    startCursor: string | null, // Cursor of first item
    endCursor: string | null,   // Cursor of last item (use for next request)
    totalCount?: number         // Optional total count (not computed by default)
  }
}
```

### Example Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Project Alpha",
      "teamId": "team-123",
      "createdAt": "2026-01-07T10:00:00Z",
      "_count": {
        "projectMembers": 5
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Project Beta",
      "teamId": "team-123",
      "createdAt": "2026-01-06T15:30:00Z",
      "_count": {
        "projectMembers": 3
      }
    }
    // ... more items
  ],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "NTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAw",
    "endCursor": "NjYwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAx",
    "totalCount": null
  }
}
```

---

## Paginated Endpoints

### Projects

#### Get Projects by Team ID

```http
GET /projects?teamId={teamId}&userId={userId}&cursor={cursor}&limit={limit}
```

**Parameters:**

- `teamId` (required): Team ID
- `userId` (required): User ID for authorization
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:** Paginated list of projects with member counts

---

#### Get Project Members

```http
GET /projects/members?projectId={projectId}&memberId={memberId}&cursor={cursor}&limit={limit}
```

**Body:**

```json
{
  "projectId": "project-123",
  "memberId": "user-456"
}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page

**Response:** Paginated list of project members with user details

---

### Teams

#### Get Teams by User ID

```http
GET /teams/user-teams?userId={userId}&cursor={cursor}&limit={limit}
```

**Parameters:**

- `userId` (required): User ID
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page

**Response:** Paginated list of teams with member counts

---

#### Get Team Members

```http
GET /teams/members?teamId={teamId}&cursor={cursor}&limit={limit}
```

**Parameters:**

- `teamId` (required): Team ID
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page

**Response:** Paginated list of team members with user details

---

### Documents

#### Get Documents by Project ID

```http
GET /documents?projectId={projectId}&userId={userId}&cursor={cursor}&limit={limit}
```

**Body:**

```json
{
  "projectId": "project-123",
  "userId": "user-456"
}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page

**Response:** Paginated list of documents with author information

---

### Audit Logs

#### Get All Audit Logs (Admin Only)

```http
GET /audit-logs?userId={userId}&action={action}&cursor={cursor}&limit={limit}
```

**Parameters:**

- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `entityType` (optional): Filter by entity type
- `entityId` (optional): Filter by entity ID
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:** Paginated list of audit logs

---

#### Get User Audit Logs

```http
GET /audit-logs/user/{userId}?cursor={cursor}&limit={limit}
```

**Parameters:**

- `userId` (required): User ID (path parameter)
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page

**Response:** Paginated list of audit logs for the specified user

---

## Frontend Integration

### React Example (Infinite Scroll)

```typescript
import { useState, useEffect } from 'react';

interface PaginatedResponse<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

function useInfiniteProjects(teamId: string, userId: string) {
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId,
        userId,
        limit: '20',
        ...(cursor && { cursor }),
      });

      const response = await fetch(`/api/projects?${params}`);
      const data: PaginatedResponse<Project> = await response.json();

      setProjects(prev => [...prev, ...data.data]);
      setCursor(data.pageInfo.endCursor);
      setHasMore(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { projects, loadMore, hasMore, loading };
}

// Usage in component
function ProjectList() {
  const { projects, loadMore, hasMore, loading } = useInfiniteProjects(
    'team-123',
    'user-456'
  );

  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

---

### React Example (Page-by-Page)

```typescript
function usePaginatedProjects(teamId: string, userId: string) {
  const [projects, setProjects] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPage = async (newCursor: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teamId,
        userId,
        limit: '20',
        ...(newCursor && { cursor: newCursor }),
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      setProjects(data.data);
      setCursor(data.pageInfo.endCursor);
      setHasNext(data.pageInfo.hasNextPage);
      setHasPrev(newCursor !== null);
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (hasNext && cursor) {
      fetchPage(cursor);
    }
  };

  const firstPage = () => {
    fetchPage(null);
  };

  useEffect(() => {
    fetchPage(null);
  }, [teamId, userId]);

  return { projects, nextPage, firstPage, hasNext, hasPrev, loading };
}
```

---

### Next.js Server Component Example

```typescript
// app/projects/page.tsx
import { Suspense } from 'react';

interface PageProps {
  searchParams: {
    cursor?: string;
    limit?: string;
  };
}

async function getProjects(cursor?: string, limit = 20) {
  const params = new URLSearchParams({
    teamId: 'team-123',
    userId: 'user-456',
    limit: limit.toString(),
    ...(cursor && { cursor }),
  });

  const res = await fetch(`${process.env.API_URL}/projects?${params}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const { cursor, limit } = searchParams;
  const data = await getProjects(cursor, limit ? parseInt(limit) : 20);

  return (
    <div>
      <h1>Projects</h1>

      <div className="grid gap-4">
        {data.data.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        {data.pageInfo.hasNextPage && (
          <a
            href={`/projects?cursor=${data.pageInfo.endCursor}&limit=${limit || 20}`}
            className="btn btn-primary"
          >
            Next Page
          </a>
        )}
      </div>
    </div>
  );
}
```

---

### Vue.js Example

```vue
<template>
  <div>
    <div v-for="project in projects" :key="project.id">
      <ProjectCard :project="project" />
    </div>

    <button v-if="hasMore" @click="loadMore" :disabled="loading">
      {{ loading ? 'Loading...' : 'Load More' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const projects = ref([]);
const cursor = ref<string | null>(null);
const hasMore = ref(true);
const loading = ref(false);

const loadMore = async () => {
  if (loading.value || !hasMore.value) return;

  loading.value = true;
  try {
    const params = new URLSearchParams({
      teamId: 'team-123',
      userId: 'user-456',
      limit: '20',
      ...(cursor.value && { cursor: cursor.value }),
    });

    const response = await fetch(`/api/projects?${params}`);
    const data = await response.json();

    projects.value.push(...data.data);
    cursor.value = data.pageInfo.endCursor;
    hasMore.value = data.pageInfo.hasNextPage;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMore();
});
</script>
```

---

## Best Practices

### 1. Always Check `hasNextPage`

```typescript
// ✅ Good
if (data.pageInfo.hasNextPage) {
  fetchNextPage(data.pageInfo.endCursor);
}

// ❌ Bad - might request empty pages
fetchNextPage(data.pageInfo.endCursor);
```

### 2. Handle Empty Results

```typescript
if (data.data.length === 0) {
  // Show empty state
  return <EmptyState />;
}
```

### 3. Store Cursor Properly

```typescript
// ✅ Good - use endCursor from response
setCursor(data.pageInfo.endCursor);

// ❌ Bad - don't construct cursors manually
setCursor(data.data[data.data.length - 1].id);
```

### 4. Respect Rate Limits

```typescript
// Add debouncing for infinite scroll
const debouncedLoadMore = debounce(loadMore, 300);
```

### 5. Show Loading States

```typescript
{loading && <Spinner />}
{!loading && hasMore && <button onClick={loadMore}>Load More</button>}
```

---

## Error Handling

### Invalid Cursor

**Error Response:**

```json
{
  "statusCode": 400,
  "message": "Invalid cursor format",
  "error": "Bad Request"
}
```

**Handling:**

```typescript
try {
  const data = await fetchProjects(cursor);
  // ...
} catch (error) {
  if (error.statusCode === 400) {
    // Reset to first page
    fetchProjects(null);
  }
}
```

### Unauthorized Access

**Error Response:**

```json
{
  "statusCode": 401,
  "message": "You are not a member of the team",
  "error": "Unauthorized"
}
```

---

## Performance Tips

### 1. Use Appropriate Page Sizes

```typescript
// ✅ Good - reasonable page size
const limit = 20;

// ❌ Bad - too small (many requests)
const limit = 5;

// ❌ Bad - too large (slow response)
const limit = 500; // Max is 100 anyway
```

### 2. Implement Virtual Scrolling

For large lists, use virtual scrolling libraries:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualProjectList() {
  const parentRef = useRef();
  const { projects, loadMore } = useInfiniteProjects();

  const virtualizer = useVirtualizer({
    count: projects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index}>
            <ProjectCard project={projects[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Prefetch Next Page

```typescript
const prefetchNextPage = async () => {
  if (cursor && hasMore) {
    // Prefetch in background
    queryClient.prefetchQuery(['projects', cursor], () =>
      fetchProjects(cursor),
    );
  }
};

// Trigger prefetch when user scrolls near bottom
useEffect(() => {
  if (scrollPosition > 0.8) {
    prefetchNextPage();
  }
}, [scrollPosition]);
```

---

## Migration from Offset-Based Pagination

If you previously used offset-based pagination (e.g., in Audit Logs):

### Before (Offset-Based)

```http
GET /audit-logs?page=2&limit=50
```

### After (Cursor-Based)

```http
# First request
GET /audit-logs?limit=50

# Subsequent requests
GET /audit-logs?cursor=abc123&limit=50
```

### Code Migration

```typescript
// Before
const fetchLogs = async (page: number) => {
  const response = await fetch(`/api/audit-logs?page=${page}&limit=50`);
  const data = await response.json();
  return data.data; // Array of logs
};

// After
const fetchLogs = async (cursor: string | null) => {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.append('cursor', cursor);

  const response = await fetch(`/api/audit-logs?${params}`);
  const data = await response.json();
  return {
    logs: data.data,
    nextCursor: data.pageInfo.endCursor,
    hasMore: data.pageInfo.hasNextPage,
  };
};
```

---

## Troubleshooting

### Issue: Duplicate Items Appearing

**Cause:** Using stale cursors or not properly managing state

**Solution:**

```typescript
// Reset cursor when filters change
useEffect(() => {
  setCursor(null);
  setProjects([]);
  loadMore();
}, [teamId, userId]);
```

### Issue: Missing Items

**Cause:** Items being deleted/updated between requests

**Solution:** Cursor pagination handles this automatically. Items won't be skipped.

### Issue: Slow Performance

**Cause:** Missing database indexes

**Solution:** Ensure migrations are applied:

```bash
pnpm exec prisma migrate deploy
```

---

## Technical Details

### Database Indexes

The following composite indexes optimize cursor pagination:

```prisma
// Projects
@@index([teamId, createdAt, id])
@@index([teamId, deletedAt, createdAt, id])

// ProjectMembers
@@index([projectId, createdAt, id])

// Teams
@@index([deletedAt, createdAt, id])

// TeamMembers
@@index([teamId, createdAt, id])

// Documents
@@index([projectId, deletedAt, createdAt, id])

// AuditLogs
@@index([createdAt, id])
@@index([userId, createdAt, id])
```

### Query Pattern

```typescript
// Cursor-based query
const projects = await prisma.project.findMany({
  where: {
    teamId,
    deletedAt: null,
    ...(cursor && {
      id: { lt: decodeCursor(cursor) }, // Key cursor condition
    }),
  },
  orderBy: [
    { createdAt: 'desc' },
    { id: 'desc' }, // Tiebreaker for consistent ordering
  ],
  take: limit + 1, // Fetch one extra to check for next page
});
```

---

## Additional Resources

- [Cursor Pagination Guide](https://relay.dev/graphql/connections.htm) - GraphQL Cursor Connections Specification
- [Prisma Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination) - Official Prisma documentation
- [API Design Patterns](https://cloud.google.com/apis/design/design_patterns#list_pagination) - Google Cloud API Design Guide

---

## Support

For questions or issues related to pagination:

1. Check the [API documentation](http://localhost:3000/api) (Swagger)
2. Review the [walkthrough document](../walkthrough.md)
3. Open an issue on GitHub

---

**Last Updated:** January 7, 2026  
**API Version:** 1.0.0
