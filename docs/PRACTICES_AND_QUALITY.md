# Engineering practices, concepts, and quality attributes

This document lists **coding and system-design practices** used in Ledger, **how** they show up in the repo, and why the result is **maintainable**, **scalable**, and **consistent**.

---

## 1. Backend practices & concepts

### Layered architecture (routes → controllers → models)

**Concept:** Separated **HTTP wiring**, **use-case orchestration**, and **persistence**.

**How it is followed:**

- `routes/*` only declared paths, middleware order, and which controller function runs.
- `controllers/*` implement rules (“can this admin change that user’s password?”) and call models.
- `models/*` contain SQL and return plain data.

**Why:** We can change a query without touching HTTP status codes, and add a policy in the controller without hunting through SQL strings.

---

### Role-based access control (RBAC)

**Concept:** Permissions are expressed as **roles** and enforced **before** business logic runs.

**How we follow it:**

- `middleware/auth.js` establishes **who** (`req.user` from JWT).
- `middleware/rbac.js` `authorize([...])` restricts **which roles** may hit a route.
- Extra rules (e.g. primary admin email, “no setting another admin’s password”) live in **controllers** where they read clearly.

**Why:** The permission matrix is visible on the route definitions; reviewers do not have to reverse-engineer security from SQL.

---

### Input validation at the edge

**Concept:** Never trusting the client; validating **shape and constraints** as soon as the request enters your code.

**How it is implemented:**

- Zod schemas in `validation/*`.
- `middleware/validate.js` parses `body` / `query` / `params` and returns **400** with `details` on failure.

**Why:** Invalid data never reaches SQL; error shape is predictable for the frontend.

---

### Consistent API errors

**Concept:** Clients should always get the same **envelope** for failures.

**How it is done:**

- Operational failures use `ApiError` with `statusCode` + `message`.
- `errorHandler` maps unknown errors and known Postgres codes (e.g. unique violation) to JSON: `{ success: false, message, details? }`.

**Why:** One `formatApiError` helper on the frontend; easier Postman and integration tests.

---

### Stateless authentication (JWT)

**Concept:** Server verifies a **signed token** instead of storing sessions in memory/DB for every request.

**How :**

- `utils/jwt.js` + `authUser` normalization; token in `localStorage` on the client.

**Trade-off:** Revocation before expiry needs a blocklist or short TTL (documented elsewhere). For this scope, simplicity wins.

---

### Password security

**Concept:** Storing **hashes**, not passwords; enforce **strength** on create/change.

**How its done:**

- bcrypt via `utils/password.js`.
- `passwordPolicy.js` shared between Zod and any future flows.

---

### Defense in depth (lightweight)

**Concept:** Multiple modest protections beat one “perfect” wall.

**How it's done:**

- Helmet, CORS, sanitized middleware, rate limits (global + auth + per-user writes), confirmation passwords for destructive admin actions.

---

### Soft delete

**Concept:** Marking rows inactive instead of `DELETE` to preserve **audit trail** and **referential integrity**.

**How we follow it:**

- Records: `deleted` flag; categories: `deleted_at`; users: `deleted` + `deleted_at` for org removal.

---

### Database migrations

**Concept:** Schema changes are **versioned scripts**, not manual drift.

**How it is implemented:**

- `sql/migrations/*.sql` run in order via `scripts/apply-migration.js`.

---

### Automated tests (targeted)

**Concept:** Testing **pure logic** and **critical HTTP surfaces** without needing a live DB for everything.

**How :**

- Jest: `authUser`, `passwordPolicy`, Supertest smoke on `app` (health, 401 on protected route).

---

## 2. Frontend practices & concepts

### Single source of truth for API calls

**Concept:** Centralize base URL, headers, and error handling.

**How we follow it:**

- `api/client.js` Bearer injection, JSON parse, uniform errors.

---

### Context for authentication

**Concept:** Avoid prop-drilling user/session through every component.

**How we follow it:**

- `AuthContext` exposes `user`, `login`, `logout`, role helpers.

---

### Route-level protection

**Concept:** Mirror backend expectations: do not render admin pages for viewers.

**How we follow it:**

- `ProtectedRoute`, `AdminRoute`, `AnalystOrAdminRoute` in `App.jsx`.

---

### Controlled forms & debounced search

**Concept:** Predictable input handling; reduce API chatter.

**How we follow it:**

- Records page: debounced search; explicit Apply/Clear for heavier filters.

---

## 3. System design concepts (how they appear here)

| Concept | Where you see it |
|---------|------------------|
| **Separation of concerns** | routes / controllers / models / validation |
| **Least privilege** | RBAC + extra controller checks |
| **Idempotent-ish reads** | GET endpoints do not mutate |
| **Explicit writes** | POST/PATCH/DELETE with validation + limits |
| **Observability (dev)** | Morgan logging, errorHandler dev hints |
| **Configuration via environment** | `config/env.js`, no secrets in code |

---

## 4. Maintainability : how this codebase earns it

**Readable boundaries:** A new developer can open `routes/record.routes.js` and see exactly which roles and validators apply before reading SQL.

**Small files with one job:** Models do not import Express; controllers do not build ad hoc SQL strings.

**Shared utilities:** Password policy and JWT user normalization live once under `utils/`.

**Documentation in-repo:** `CODEBASE_MAP.md`, `ARCHITECTURE.md`, `API.md` reduce onboarding time.

**Change isolation:** Switching viewer dashboard scope or adding a field to records mostly touches one model + one validation schema + one form.

---

## 5. Scalability : what scales and what would be next

**What already scales horizontally (within reason):**

- **Stateless API** : you can run multiple Node instances behind a load balancer; JWT carries identity.

- **Connection pooling** : `pg` `Pool` amortizes TCP/SSL to Postgres.

**Natural next steps if traffic or data grew:**

- **Read replicas** or **materialized views** for heavy dashboard queries (logic stays in `dashboard.model.js`).

- **Queue** for async jobs (exports, emails).

- **Session store or token blocklist** if instant logout / revocation becomes mandatory.

- **Stricter rate limits** and **WAF** at the edge.

The current structure does **not** block** those moves: persistence is already behind models, not inside controllers.

---

## 6. Consistency : how behavior stays predictable

**Envelopes:** Success responses use `{ success: true, data | message }`; errors use `{ success: false, message, details? }`.

**HTTP semantics:** 401 for auth, 403 for forbidden, 404 for missing, 409 for conflicts — applied through `ApiError` and `errorHandler`.

**Naming:** `snake_case` in JSON for DB-aligned fields (`record_date`, `is_primary_admin`) matches Postgres and reduces mapping bugs.

**Cross-cutting order:** Global middleware order in `app.js` is fixed; per-route order in routers is `auth` → `authorize` → `validate` → handler.

**Single policy source:** Strong passwords are defined once (`passwordPolicy.js`) and referenced from Zod.

---

## 7. Summary

This project intentionally favors **clarity and explicitness** over clever abstractions: you can trace a request from the browser to SQL and back using the map in **`CODEBASE_MAP.md`**. That transparency is what makes the system **maintainable**, gives it a credible path to **scale**, and keeps API and security behavior **consistent** as features grow.
