# Pagination Quick Reference

## Quick Start

### Basic Request

```http
GET /projects?teamId=team-123&userId=user-456&limit=20
```

### Next Page Request

```http
GET /projects?teamId=team-123&userId=user-456&limit=20&cursor=abc123
```

---

## All Paginated Endpoints

| Endpoint                   | Method | Parameters                                                  |
| -------------------------- | ------ | ----------------------------------------------------------- |
| `/projects`                | GET    | `teamId`, `userId`, `cursor?`, `limit?`                     |
| `/projects/members`        | GET    | Body: `projectId`, `memberId`<br>Query: `cursor?`, `limit?` |
| `/teams/user-teams`        | GET    | `userId`, `cursor?`, `limit?`                               |
| `/teams/members`           | GET    | `teamId`, `cursor?`, `limit?`                               |
| `/documents`               | GET    | Body: `projectId`, `userId`<br>Query: `cursor?`, `limit?`   |
| `/audit-logs`              | GET    | `userId?`, `action?`, `cursor?`, `limit?`                   |
| `/audit-logs/user/:userId` | GET    | `cursor?`, `limit?`                                         |

---

## Response Structure

```json
{
  "data": [...],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "abc123",
    "endCursor": "xyz789"
  }
}
```

---

## Parameters

| Parameter | Type   | Required | Default | Max |
| --------- | ------ | -------- | ------- | --- |
| `cursor`  | string | No       | -       | -   |
| `limit`   | number | No       | 20      | 100 |

---

## React Hook Example

```typescript
function useInfinitePagination(endpoint: string, params: object) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    const query = new URLSearchParams({
      ...params,
      limit: '20',
      ...(cursor && { cursor }),
    });

    const res = await fetch(`${endpoint}?${query}`);
    const data = await res.json();

    setItems((prev) => [...prev, ...data.data]);
    setCursor(data.pageInfo.endCursor);
    setHasMore(data.pageInfo.hasNextPage);
  };

  return { items, loadMore, hasMore };
}

// Usage
const { items, loadMore, hasMore } = useInfinitePagination('/api/projects', {
  teamId: 'team-123',
  userId: 'user-456',
});
```

---

## Common Patterns

### Infinite Scroll

```typescript
const { items, loadMore, hasMore } = useInfiniteProjects();

return (
  <>
    {items.map(item => <Item key={item.id} {...item} />)}
    {hasMore && <button onClick={loadMore}>Load More</button>}
  </>
);
```

### Reset on Filter Change

```typescript
useEffect(() => {
  setCursor(null);
  setItems([]);
  loadMore();
}, [teamId, userId]);
```

### Check for More Pages

```typescript
if (data.pageInfo.hasNextPage) {
  // Load next page
  fetchPage(data.pageInfo.endCursor);
}
```

---

## Best Practices

✅ **DO:**

- Use `endCursor` from response for next request
- Check `hasNextPage` before loading more
- Reset cursor when filters change
- Handle loading and error states

❌ **DON'T:**

- Construct cursors manually
- Ignore `hasNextPage` flag
- Request without checking if more data exists
- Use offset/page-based logic

---

## Error Handling

```typescript
try {
  const data = await fetchPage(cursor);
  // Process data
} catch (error) {
  if (error.statusCode === 400) {
    // Invalid cursor - reset to first page
    fetchPage(null);
  }
}
```

---

## Performance Tips

1. **Use appropriate page sizes** (20-50 items)
2. **Implement virtual scrolling** for large lists
3. **Prefetch next page** when user scrolls near bottom
4. **Debounce scroll events** (300ms)
5. **Cache responses** when possible

---

## Migration from Offset

### Before

```http
GET /audit-logs?page=2&limit=50
```

### After

```http
GET /audit-logs?cursor=abc123&limit=50
```

### Code Change

```typescript
// Before
const page = 2;
fetch(`/api/logs?page=${page}&limit=50`);

// After
const cursor = 'abc123';
fetch(`/api/logs?cursor=${cursor}&limit=50`);
```

---

## Full Documentation

See [PAGINATION.md](PAGINATION.md) for complete documentation including:

- Detailed endpoint specifications
- Frontend integration examples (React, Vue, Next.js)
- Performance optimization techniques
- Troubleshooting guide
- Technical implementation details

---

**Last Updated:** January 7, 2026
