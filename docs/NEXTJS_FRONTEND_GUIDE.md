# Next.js Frontend Implementation Guide

## Overview

This document outlines how to build a Next.js frontend for the workspace-core-api that implements Clerk-style authentication with automatic token refresh, httpOnly cookies, and seamless user experience.

---

## 🎯 Goals

- **Clerk-like UX**: Automatic token refresh, no user interruption
- **Production Security**: httpOnly cookies, CSRF protection, XSS prevention
- **Full Control**: No vendor lock-in, you own the entire auth flow
- **Seamless Integration**: Works perfectly with your NestJS backend

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App (Client)                                 │  │
│  │  - No tokens in localStorage                          │  │
│  │  - Tokens in httpOnly cookies                         │  │
│  │  - Auto-refresh via middleware                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (Server)                          │  │
│  │  - Reads cookies                                      │  │
│  │  - Refreshes tokens when needed                       │  │
│  │  - Sets new httpOnly cookies                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕
              ┌────────────────────────┐
              │   workspace-core-api   │
              │   (NestJS Backend)     │
              │   localhost:3000       │
              └────────────────────────┘
```

---

## 📁 Project Structure

```
workspace-frontend/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts          # Login endpoint
│   │       ├── logout/route.ts         # Logout endpoint
│   │       ├── logout-all/route.ts     # Logout all devices
│   │       ├── refresh/route.ts        # Manual refresh (optional)
│   │       └── me/route.ts             # Get current user
│   ├── (auth)/
│   │   ├── login/page.tsx              # Login page
│   │   └── signup/page.tsx             # Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Dashboard layout
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── teams/
│   │   │   ├── page.tsx                # Teams list
│   │   │   └── [teamId]/
│   │   │       ├── page.tsx            # Team details
│   │   │       ├── settings/page.tsx   # Team settings
│   │   │       └── members/page.tsx    # Team members
│   │   └── projects/
│   │       ├── page.tsx                # Projects list
│   │       └── [projectId]/
│   │           ├── page.tsx            # Project details
│   │           └── documents/page.tsx  # Project documents
│   └── layout.tsx
├── lib/
│   ├── auth.ts                         # Auth utilities
│   ├── api-client.ts                   # API client with auto-refresh
│   └── constants.ts                    # API URLs, etc.
├── hooks/
│   ├── useAuth.ts                      # Auth hook
│   ├── useTeams.ts                     # Teams data hook
│   └── useProjects.ts                  # Projects data hook
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── teams/
│   │   ├── TeamCard.tsx
│   │   ├── TeamMemberList.tsx
│   │   └── CreateTeamModal.tsx
│   └── ui/
│       └── ... (shadcn/ui components)
└── middleware.ts                       # Next.js middleware (auto-refresh)
```

---

## 🔐 Core Implementation

### 1. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
```

### 2. Login API Route

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    // Call your NestJS backend
    const response = await fetch(`${API_URL}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'unknown',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: response.status },
      );
    }

    const { access_token, refresh_token } = await response.json();

    // Create response
    const res = NextResponse.json({ success: true });

    // Set httpOnly cookies (secure!)
    res.cookies.set('access_token', access_token, {
      httpOnly: true, // Cannot be accessed by JS (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict', // CSRF protection
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    res.cookies.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
```

### 3. Logout API Route

```typescript
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // Call your backend to revoke the token
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Clear cookies
  const res = NextResponse.json({ success: true });
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');

  return res;
}
```

### 4. Logout All Devices API Route

```typescript
// app/api/auth/logout-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Call your backend to revoke all tokens
    await fetch(`${API_URL}/auth/logout-all`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Clear cookies
    const res = NextResponse.json({ success: true });
    res.cookies.delete('access_token');
    res.cookies.delete('refresh_token');

    return res;
  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json(
      { error: 'Failed to logout from all devices' },
      { status: 500 },
    );
  }
}
```

### 5. Auto-Refresh Middleware (THE MAGIC!)

```typescript
// middleware.ts (Next.js root)
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // If no tokens at all, redirect to login
  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if access token is expired or expires soon (< 5 min)
  if (accessToken) {
    try {
      const decoded: any = jwtDecode(accessToken);
      const expiresAt = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If token is still valid and not expiring soon, continue
      if (timeUntilExpiry > 5 * 60 * 1000) {
        return NextResponse.next();
      }

      console.log('Access token expiring soon, refreshing...');
    } catch (error) {
      console.error('Invalid access token:', error);
      // Token is invalid, try to refresh
    }
  }

  // Token expired or expiring soon - refresh it!
  if (refreshToken) {
    try {
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': request.headers.get('user-agent') || 'unknown',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { access_token, refresh_token: new_refresh_token } =
          await response.json();

        console.log('Token refreshed successfully');

        // Create response and update cookies
        const res = NextResponse.next();

        res.cookies.set('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 15, // 15 minutes
          path: '/',
        });

        res.cookies.set('refresh_token', new_refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        return res;
      } else {
        console.error('Refresh failed:', await response.text());
      }
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }

  // Refresh failed - clear cookies and redirect to login
  const res = NextResponse.redirect(new URL('/login', request.url));
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');
  return res;
}

// Protect these routes (all dashboard routes)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teams/:path*',
    '/projects/:path*',
    '/documents/:path*',
    // Add all protected routes here
  ],
};
```

### 6. API Client Utility

```typescript
// lib/api-client.ts
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  // Get access token from cookies (server-side only)
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // Add authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  // Make request to your NestJS backend
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: (endpoint: string) => apiClient(endpoint, { method: 'GET' }),
  post: (endpoint: string, data: any) =>
    apiClient(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  patch: (endpoint: string, data: any) =>
    apiClient(endpoint, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint: string) => apiClient(endpoint, { method: 'DELETE' }),
};
```

### 7. Auth Hook (Client-Side)

```typescript
// hooks/useAuth.ts
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh(); // Refresh server components
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAll = async () => {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout-all', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout all error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { login, logout, logoutAll, isLoading, error };
}
```

### 8. Login Page Example

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled in useAuth hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Sign In</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 9. Dashboard Page Example (Server Component)

```typescript
// app/(dashboard)/page.tsx
import { api } from '@/lib/api-client';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    // Fetch data server-side (token automatically included)
    const teams = await api.get('/teams');

    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teams.map((team: any) => (
            <div key={team.id} className="p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold">{team.name}</h3>
              <p className="text-gray-600">{team.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    // If API call fails (e.g., unauthorized), redirect to login
    redirect('/login');
  }
}
```

---

## 🔒 Security Features

### 1. httpOnly Cookies

- ✅ Tokens cannot be accessed by JavaScript (XSS protection)
- ✅ Automatically sent with requests
- ✅ Secure flag in production (HTTPS only)

### 2. CSRF Protection

- ✅ `sameSite: 'strict'` prevents cross-site requests
- ✅ Cookies only sent to same-origin

### 3. Token Rotation

- ✅ New refresh token on every refresh
- ✅ Old token immediately revoked
- ✅ Prevents token replay attacks

### 4. Automatic Refresh

- ✅ Middleware refreshes tokens before expiry
- ✅ User never sees authentication errors
- ✅ Seamless experience

---

## 🎯 User Experience Flow

```
1. User visits /dashboard
   ↓
2. Middleware checks access_token (13 min remaining)
   ↓
3. Token valid, continue to page
   ↓
4. Page loads, shows user data
   ↓
   ... 10 minutes later ...
   ↓
5. User clicks on /teams
   ↓
6. Middleware checks access_token (3 min remaining < 5 min threshold)
   ↓
7. Middleware calls backend /auth/refresh-token
   ↓
8. Backend validates refresh_token (checks DB, not revoked)
   ↓
9. Backend returns new tokens
   ↓
10. Middleware updates cookies
   ↓
11. User continues to /teams (NEVER NOTICED REFRESH!)
   ↓
12. Page loads with fresh token
```

**User Experience:**

- ✅ Never sees "Session expired" errors
- ✅ Never manually refreshes
- ✅ Seamless, Clerk-like experience
- ✅ Can logout from all devices

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "jwt-decode": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 🚀 Getting Started

### 1. Create Next.js App

```bash
npx create-next-app@latest workspace-frontend
cd workspace-frontend
npm install jwt-decode
```

### 2. Set Up Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
```

### 3. Implement Files

Follow the structure above and implement:

1. API routes (`/api/auth/*`)
2. Middleware (`middleware.ts`)
3. API client (`lib/api-client.ts`)
4. Auth hook (`hooks/useAuth.ts`)
5. Pages (login, dashboard, etc.)

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3001` (or your Next.js port)

---

## ✅ Testing Checklist

- [ ] Login sets httpOnly cookies
- [ ] Dashboard loads with valid token
- [ ] Token auto-refreshes when < 5 min remaining
- [ ] Logout clears cookies and revokes token
- [ ] Logout all revokes all user's tokens
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Cookies are httpOnly, secure, sameSite=strict
- [ ] Token rotation works (new refresh token on each refresh)

---

## 🎉 Result

You now have:

- ✅ Clerk-like authentication UX
- ✅ Production-grade security
- ✅ Full control over auth flow
- ✅ No vendor lock-in
- ✅ Seamless token refresh
- ✅ Multi-device logout support

**This is production-ready and portfolio-worthy!** 🚀
