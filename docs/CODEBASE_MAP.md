# Codebase map: files, roles, and data flow

This document describes **what each important file does** and how it participates in **end-to-end data flow**: what goes **in** (HTTP, env, props) and what comes **out** (JSON, UI, DB side effects).

**High-level flow (happy path):**

```text
Browser  →  apiFetch (Bearer JWT)  →  Express app  →  /api router  →  domain router
    →  middleware chain (sanitize → auth → RBAC → validate → rate limit)
    →  controller  →  model (SQL)  →  Postgres
    ←  JSON { success, data | message }  ←  same path back
```

---

## Root & config (repo)

| Path | Role in flow |
|------|----------------|
| `README.md` | Human setup; links to deeper docs. |
| `docs/API.md` | Postman-oriented endpoint list (output: reference only). |
| `docs/ARCHITECTURE.md` | System narrative + diagrams. |
| `docs/CODEBASE_MAP.md` | This file. |
| `docs/PRACTICES_AND_QUALITY.md` | Practices + maintainability / scale / consistency. |
| `backend/.env` | **In:** secrets (`SUPABASE_DB_URL`, `JWT_SECRET`, …). **Out:** read by `config/env.js` at runtime (never committed). |
| `backend/.env.example` | **Out:** template for required env keys. |
| `backend/package.json` | **In:** `npm` scripts. **Out:** dependency graph for backend. |
| `frontend/package.json` | Same for Vite/React app. |
| `frontend/vite.config.js` | **In:** dev server. **Out:** proxy `/api` → backend (typical local dev). |

---

## Backend: entry & shell

| File | What it does | In → Out |
|------|----------------|----------|
| `src/server.js` | Boot: `validateEnv()`, `testConnection()` (DB ping), then `app.listen`. | **In:** process env. **Out:** listening HTTP server; on failure, stderr + `process.exit(1)`. |
| `src/app.js` | Express app factory: global middleware stack, mount `/api`, `notFound`, `errorHandler`. | **In:** incoming `req`. **Out:** `res` via routers or error JSON. |

---

## Backend - config

| File | What it does | In → Out |
|------|----------------|----------|
| `src/config/env.js` | Loads `backend/.env`, exposes `env` object (`port`, `db`, `jwt`). `validateEnv()` ensures required keys. | **In:** `process.env`. **Out:** `env` module exports; throws if misconfigured. |
| `src/config/db.js` | `pg` `Pool`: connection string (SSL params stripped from URI when needed), timeouts. `query()` runs SQL; `testConnection()` runs `SELECT 1`. | **In:** SQL text + params from models. **Out:** rows array to callers; TCP/SSL to Postgres. |

---

## Backend routes (HTTP → which handler)

| File | What it does | In → Out |
|------|----------------|----------|
| `src/routes/index.js` | Mounts `sanitizeInput`, `/health`, then `/auth`, `/users`, `/records`, `/dashboard`, `/categories`. | **In:** `req` under `/api/*`. **Out:** delegated to sub-routers. |
| `src/routes/auth.routes.js` | Register, login, `me`, `PATCH /password`. Rate limits on register/login. | **In:** JSON bodies, Bearer on protected routes. **Out:** JSON token/user or errors. |
| `src/routes/user.routes.js` | Admin-only user CRUD-ish: list, create, get, patch, deactivate, soft-remove, set password. | **In:** params `id`, JSON bodies, Bearer admin. **Out:** user JSON / messages. |
| `src/routes/record.routes.js` | Records: list/detail (admin+analyst), mutations (admin only). | **In:** query filters, JSON body, Bearer. **Out:** paginated records / single row. |
| `src/routes/dashboard.routes.js` | Summary, recent, categories, trends. | **In:** query (`granularity`, `periods`, `limit`), Bearer. **Out:** aggregate JSON. |
| `src/routes/category.routes.js` | List categories (all roles); create/delete (admin). | **In:** Bearer, JSON on write. **Out:** category rows. |

---

## Backend controllers (orchestration)

Controllers **do not** embed SQL. They validate business rules, call models, map to HTTP.

| File | What it does | In → Out |
|------|----------------|----------|
| `src/controllers/auth.controller.js` | Register (first user bootstrap), login (JWT), `me`, change own password. | **In:** `req.body`, `req.user` (after auth). **Out:** `res.json` / `next(err)`. |
| `src/controllers/user.controller.js` | Team operations: list, get, create, patch, deactivate, soft-remove, set user password (viewer/analyst only for “other” users). Verifies actor password where needed. | **In:** `req.params`, `req.body`, `req.user`. **Out:** JSON; `ApiError` for forbidden cases. |
| `src/controllers/record.controller.js` | Create/read/update/archive records. | **In:** body/query/params, `req.user` for `created_by`. **Out:** record JSON / paginated list. |
| `src/controllers/dashboard.controller.js` | Thin wrappers: call dashboard model with `req.user`, return aggregates. | **In:** `req.query`, `req.user`. **Out:** chart/summary JSON. |
| `src/controllers/category.controller.js` | List/create/soft-delete categories. | **In:** body, params. **Out:** category JSON. |

---

## Backend models (SQL boundary)

| File | What it does | In → Out |
|------|----------------|----------|
| `src/models/user.model.js` | CRUD-ish queries on `users`: find by email/id (excludes soft-deleted), list, create, update fields, password hash update, deactivate, soft-remove. | **In:** primitives/objects from controllers. **Out:** row objects or booleans. **Side effect:** Postgres read/write. |
| `src/models/record.model.js` | Inserts and selects on `financial_records` with `deleted` filter; list with pagination/filters; soft delete. | **In:** filters + `user` (role for scoping rules on some reads). **Out:** rows + counts. |
| `src/models/dashboard.model.js` | Aggregate SQL (sums, group by, trends by week/month). Org-wide non-deleted scope for dashboard roles. | **In:** `user` (mostly unused after org-wide choice), trend options. **Out:** aggregate rows. |
| `src/models/category.model.js` | List active categories; insert; soft-delete via `deleted_at`. | **In:** name, id. **Out:** rows / bool. |

---

## Backend middleware (cross-cutting)

| File | What it does | In → Out |
|------|----------------|----------|
| `src/middleware/auth.js` | Requires `Authorization: Bearer`, `jwt.verify`, `normalizeAuthUser` → `req.user`. | **In:** `req.headers`. **Out:** `next()` or `401`. |
| `src/middleware/optionalAuth.js` | Same verify if header present; else `req.user = null`. | **In:** optional Bearer. **Out:** `req.user` or null. |
| `src/middleware/rbac.js` | `authorize(['admin',…])` checks `req.user.role`. | **In:** `req.user`. **Out:** `next()` or `403`. |
| `src/middleware/validate.js` | Zod `parse` on `req.body` / `req.query` / `req.params`; replaces with parsed object. | **In:** raw `req[source]`. **Out:** parsed object or `400` via `ApiError`. |
| `src/middleware/sanitizeInput.js` | Trims string fields on `body` / `query` (light XSS hygiene). | **In:** `req`. **Out:** mutated `req`, `next()`. |
| `src/middleware/rateLimit.js` | `express-rate-limit` instances: global API, login, register, authenticated read/write keys. | **In:** `req` (IP / `req.user.id`). **Out:** `429` or `next()`. |
| `src/middleware/errorHandler.js` | Catches errors; maps `ApiError`, Postgres codes (23505, 42703) to JSON. | **In:** `err`. **Out:** `res.status(...).json({ success: false, … })`. |
| `src/middleware/notFound.js` | 404 for unknown routes. | **In:** any unmatched route. **Out:** 404 JSON. |

---

## Backend validation (schemas)

| File | What it does | In → Out |
|------|----------------|----------|
| `src/validation/auth.validation.js` | Register/login/change-password shapes + strong password. | **In:** raw objects. **Out:** parsed objects or ZodError → validate middleware. |
| `src/validation/user.validation.js` | Create/patch user, deactivate/remove, admin set password. | Same pattern. |
| `src/validation/record.validation.js` | Create/update/list query shapes. | Same. |
| `src/validation/category.validation.js` | Create category. | Same. |
| `src/validation/dashboard.validation.js` | Trends query (`granularity`, `periods`). | Same. |
| `src/validation/common.params.validation.js` | Numeric `id` param. | Same. |
| `src/validation/user.query.validation.js` | List users pagination/search. | Same. |

---

## Backend utils

| File | What it does | In → Out |
|------|----------------|----------|
| `src/utils/apiError.js` | `ApiError` class (`statusCode`, `message`, `details`). | **In:** constructor args. **Out:** instance thrown to `next`. |
| `src/utils/jwt.js` | `signToken` (normalized payload), `verifyToken`. | **In:** payload / string token, `JWT_SECRET`. **Out:** string JWT / decoded object. |
| `src/utils/authUser.js` | `normalizeAuthUser` — stable `id`/`role`/`email` for DB/JWT alignment. | **In:** decoded JWT object. **Out:** plain object for `req.user`. |
| `src/utils/password.js` | bcrypt hash/compare wrappers. | **In:** plain/hash strings. **Out:** hash / boolean. |
| `src/utils/passwordPolicy.js` | Strong password rules (shared with Zod). | **In:** string. **Out:** error message or null. |

---

## Backend SQL & scripts

| File | What it does | In → Out |
|------|----------------|----------|
| `sql/schema.sql` | Canonical DDL (users, categories, financial_records, enums). | **In:** applied manually or via script. **Out:** tables in Postgres. |
| `sql/seed.sql` | Optional seed data. | **In:** run against DB. **Out:** rows. |
| `sql/migrations/*.sql` | Incremental ALTERs (e.g. soft delete columns). | **In:** `npm run db:migrate`. **Out:** updated schema. |
| `scripts/apply-schema.js` | Runs `schema.sql` against `SUPABASE_DB_URL`. | **In:** env. **Out:** schema applied. |
| `scripts/apply-seed.js` | Runs seed. | Same. |
| `scripts/apply-migration.js` | Runs all `sql/migrations/*.sql` in sorted order. | Same. |

---

## Backend tests

| File | What it does | In → Out |
|------|----------------|----------|
| `tests/setup.js` | Sets `JWT_SECRET`, dummy DB URL for Jest. | **In:** none. **Out:** `process.env` before imports. |
| `tests/authUser.test.js` | Unit tests `normalizeAuthUser`. | **In:** none. **Out:** pass/fail. |
| `tests/passwordPolicy.test.js` | Unit tests password rules. | Same. |
| `tests/app.http.test.js` | Supertest against `app` (health, 401 dashboard). | **In:** none. **Out:** pass/fail. |
| `jest.config.js` | Jest config (`setupFiles`, `testMatch`). | **In:** none. **Out:** test runner behavior. |

---

## Frontend entry & shell

| File | What it does | In → Out |
|------|----------------|----------|
| `src/main.jsx` | React root: `createRoot`, `BrowserRouter`, `AuthProvider`, `App`. | **In:** DOM `#root`. **Out:** mounted React tree. |
| `src/App.jsx` | `Routes`: public login/register; protected layout with Dashboard, Records, Team, Change password. | **In:** URL. **Out:** page components. |
| `src/index.css` | Global styles / tokens. | **In:** none. **Out:** applied CSS. |
| `src/layouts/AppLayout.jsx` | `Header` + `Outlet` for nested routes. | **In:** child route element. **Out:** chrome around pages. |

---

## Frontend: state & API

| File | What it does | In → Out |
|------|----------------|----------|
| `src/context/AuthContext.jsx` | Holds `user`, `ready`, `login`/`logout`/`register`; persists token + user in `localStorage`; `authApi.me()` on load. | **In:** child components. **Out:** context value; triggers re-renders on auth change. |
| `src/api/client.js` | `apiFetch` attaches Bearer; typed helpers `authApi`, `dashboardApi`, `recordsApi`, `usersApi`. | **In:** path + options from UI. **Out:** parsed JSON or thrown `Error` with `status`. |

---

## Frontend: pages (user flows)

| File | What it does | In → Out |
|------|----------------|----------|
| `src/pages/Login.jsx` | Email/password form → `login()` → navigate home. Password show/hide. | **In:** user typing. **Out:** JWT stored via context. |
| `src/pages/Register.jsx` | First-admin registration form. | **In:** form. **Out:** redirect to login. |
| `src/pages/Dashboard.jsx` | Loads summary, recent, categories, trends (month/week toggle). Admin sees add-record widget. | **In:** `useAuth`, APIs. **Out:** rendered cards/charts. |
| `src/pages/Records.jsx` | Debounced search + filters; Apply / **Clear filters**; pagination; admin archive. | **In:** filters → `recordsApi.list`. **Out:** table + pagination UI. |
| `src/pages/Team.jsx` | Admin list users; modals: create, edit, activate/deactivate, remove, set password (viewer/analyst). | **In:** `usersApi`. **Out:** team table. |
| `src/pages/ChangePassword.jsx` | Self-service `authApi.changePassword`. | **In:** three password fields. **Out:** success message. |

---

## Frontend: components

| File | What it does | In → Out |
|------|----------------|----------|
| `src/components/Header.jsx` | Nav links (role-gated), Password link, sign out. | **In:** `useAuth`. **Out:** navigation UI. |
| `src/components/PasswordField.jsx` | Password input + show/hide toggle. | **In:** `value`/`onChange`. **Out:** controlled field. |
| `src/components/StatCard.jsx` | Dashboard metric card. | **In:** label, value props. **Out:** styled block. |
| `src/components/TrendsChart.jsx` | Recharts area chart for trend rows (`period` / legacy `month`). | **In:** `data`, `granularity`. **Out:** SVG chart. |
| `src/components/CategoryChart.jsx` | Category breakdown visualization. | **In:** `rows`. **Out:** chart UI. |
| `src/components/RecentActivity.jsx` | List recent transactions. | **In:** `rows`. **Out:** list UI. |
| `src/components/AdminAddRecord.jsx` | Form → `recordsApi.create` → callback refresh. | **In:** `onCreated`. **Out:** new row in DB via API. |

---

## Frontend : lib

| File | What it does | In → Out |
|------|----------------|----------|
| `src/lib/errors.js` | `formatApiError` maps API/validation errors to display strings. | **In:** `Error` / shape. **Out:** string for alerts. |

---

## Quick reference : one request through the stack

**Example:** `GET /api/records?page=1&search=rent`

1. **Browser:** `recordsApi.list` → `fetch` with `Authorization`.
2. **app.js:** `apiRateLimiter` → `apiRoutes`.
3. **routes/index.js:** `sanitizeInput` → `recordRoutes`.
4. **record.routes.js:** `authenticate` → `authReadLimiter` → `authorize(['admin','analyst'])` → `validate(listRecordsQuerySchema)` → `getRecords`.
5. **record.controller.js:** `listRecords(req.query, req.user)`.
6. **record.model.js:** builds SQL `WHERE` + `LIMIT/OFFSET`, runs `query()`.
7. **db.js:** Postgres returns rows.
8. **Response:** `{ success: true, data: { rows, total, page, … } }` back through Express → JSON → React `setData`.

---
