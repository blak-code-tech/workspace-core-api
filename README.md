# workspace-core-api

[![NestJS](https://img.shields.io/badge/NestJS-v10.2.2-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.1-blue)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16.0-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Overview

**workspace-core-api** is a production-ready, multi-tenant backend system built with [NestJS](https://nestjs.com/) and [PostgreSQL](https://www.postgresql.org/) using [Prisma ORM](https://www.prisma.io/).

It models the core backend architecture of modern SaaS collaboration tools, such as Notion, Linear, and ClickUp, emphasizing **multi-tenant isolation, role-based access control, and secure resource management**. This project is intended as both a portfolio showcase and a reference implementation for building SaaS-ready backends.

The system supports:

- JWT-based authentication with platform-level roles
- Team and project memberships with fine-grained roles
- Scoped access to resources (documents)
- Audit logging and soft-deletion strategies
- Clean NestJS module architecture

---

## Key Features

### Authentication & Users

- JWT-based authentication
- Platform-level roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`
- Secure password storage
- Multi-tenant awareness for users

### Teams & TeamMembers

- Team creation and management
- Team-level roles: `OWNER`, `ADMIN`, `MEMBER`
- Membership management with unique constraints
- Soft-deletion of teams

### Projects & ProjectMembers

- Projects belong to teams
- Project-level roles: `ADMIN`, `EDITOR`, `VIEWER`
- Scoped access for users
- Soft-delete support

### Documents

- Documents belong to projects (team inferred via project)
- Author tracking
- Soft-deletion
- Indexed for performant queries

### Audit Logging

- Logs critical actions (create, update, delete)
- Optional `meta` JSON for action context
- Indexed for fast lookups
- Cursor-based pagination for efficient querying

### Pagination

- **Cursor-based pagination** on all list endpoints
- Consistent performance regardless of dataset size
- Prevents duplicate/missing items during pagination
- Scalable to millions of records
- See [Pagination Guide](docs/PAGINATION.md) for details

### Authorization & Guards

- Decorator-based role enforcement (`@TeamRoles`)
- Multi-level role validation in services
- Prevents privilege escalation

---

## Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Validation:** [class-validator](https://github.com/typestack/class-validator)
- **Authentication:** JWT
- **API Documentation:** [Swagger/OpenAPI](https://swagger.io/)

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker (for PostgreSQL)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/blak-code-tech/workspace-core-api.git
cd workspace-core-api
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**<br>
   **Create a .env file with:**

```bash
DATABASE_URL="postgresql://workspace_user:workspace_password@localhost:5432/workspace_core"
JWT_SECRET="your_jwt_secret_here"
```

4. **Start PostgreSQL via Docker**

```bash
docker compose up -d
```

5. **Run Prisma migrations**

```bash
pnpm exec prisma migrate dev
```

6. **Start the backend**

```bash
pnpm run start:dev
```

7. **Access Swagger API docs**<br>
   Open in your browser:

```code
http://localhost:3000/api
```

---

## API Documentation

- **[Pagination Guide](docs/PAGINATION.md)** - Comprehensive guide to cursor-based pagination
- **[Audit Logs](docs/AUDIT_LOGS.md)** - Audit logging system documentation
- **[Next.js Frontend Guide](docs/NEXTJS_FRONTEND_GUIDE.md)** - Frontend integration guide
- **[Project Specification](docs/PROJECT_SPEC.md)** - Detailed project specifications

---
