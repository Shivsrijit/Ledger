# Finance Data Processing and Access Control Backend

#### Live Application Link : https://ledger-blush-sigma.vercel.app/
#### Deployed Backend URL : https://ledger-u9p6.onrender.com/


#### Complete backend using:
- Node.js + Express
- Supabase PostgreSQL
- JWT Authentication
- RBAC (viewer / analyst / admin)
- Validation + error handling
- Dashboard summary APIs
- React (Vite) dashboard with charts (Recharts)

## Project Structure

```text
Ledger/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      validation/
    sql/
      schema.sql
      seed.sql
    .env.example
    package.json
  frontend/
    src/
    public/
    package.json
    vite.config.js
  docs/
    API.md              # All endpoints for Postman
    ARCHITECTURE.md     # Design, auth, data flow, middleware
```

## Documentation

- **[docs/API.md](docs/API.md)** — full API list for API Testing (paths, methods, bodies)...I have tested APIs in postman
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — how auth, RBAC, rate limits, and soft delete fit together.
- **[docs/ENGINEERING_NOTES.md](docs/ENGINEERING_NOTES.md)** — scenario mapping, soft delete, trade-offs (good prep for interviews).
- **[docs/CODEBASE_MAP.md](docs/CODEBASE_MAP.md)** — every important file, what it does, and how data flows through it.
- **[docs/PRACTICES_AND_QUALITY.md](docs/PRACTICES_AND_QUALITY.md)** — practices & concepts; maintainability, scalability, consistency.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — deploy frontend on **Vercel** and backend on **Render**.

### This setup part is explicitly for devs who want to clone the repo and experiment. For someone who wants to test can directly go through the given backend and frontend links. 
## 1) Backend Setup

1. Go to backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```
4. Updated `.env` with Supabase Postgres connection string. 

## 2) Database Setup (Supabase)

1. Create a Supabase project.
2. Open SQL editor in Supabase (or connect via any PostgreSQL client).
3. Run `backend/sql/schema.sql` (new projects) **or**, if you already applied an older schema, run **`npm run db:migrate`** once to apply incremental SQL (record soft-delete, primary admin, **user soft-delete columns**, etc.).
4. Create your first admin user using `POST /api/auth/register` (they become the **primary admin** : role cannot be removed and they cannot be deactivated).
5. Run `npm run db:seed` (or `backend/sql/seed.sql`). Sample rows use `created_by` = the user with the smallest `id`.

If you run seed with **no users**, the script exits with a hint to register first.

## 3) Start the API

```bash
npm run dev
```

Server:
- `http://localhost:5000`
- Health check: `GET /api/health`

## Quick Run Commands (Windows PowerShell)

From project root:
```powershell
cd .\backend
npm install
Copy-Item .env.example .env
# edit .env with your Supabase DB URL
npm run dev
```

### Frontend (React)

In a **second terminal**, from project root:

```powershell
cd .\frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The dev server proxies `/api` to `http://localhost:5000`, so keep the backend running.

- **Register** (first user only) → **Sign in** → dashboard with summary, trend chart, category bars, recent activity.
- **Viewer** sees summary + recent (own data); **Analyst/Admin** also see charts.
- **Admin** gets “Add transaction”, **Team** (user management with password confirmation for sensitive changes), and **Records** (search, filters, pagination, archive).
- **Analyst/Viewer** use **Records** with the same filters (viewer sees only their rows).

Production build: `npm run build` in `frontend`, then serve the `frontend/dist` folder with any static host (configure that host to proxy `/api` to your backend, or set `VITE_API_BASE` ,  see `frontend/.env.example` and `frontend/src/api/client.js`.

## Auth and RBAC Behavior

- First `POST /api/auth/register` user is auto-created as `admin`.
- After first user:
  - `register` requires admin JWT token.
- Roles:
  - `viewer`: can only view own records, own summary, own recent
  - `analyst`: can view all records, all summaries, trends, category breakdown
  - `admin`: full records + users + category management
- **Primary admin** (first registered user): no other admin can demote them or deactivate them. Updating another user’s role or active status requires the acting admin’s **password** in the request body.
- JSON bodies are **trimmed** server-side (emails/passwords with accidental spaces).
- API routers are mounted from `backend/src/routes/index.js`; each domain file exports its own `Router`.

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (auth required)

### Users (admin only)
- `GET /api/users?page=1&limit=10&search=` (optional name/email search)
- `GET /api/users/:id`
- `POST /api/users` — create user (name, email, password, role, optional is_active)
- `PATCH /api/users/:id` — body must include `currentPassword` (acting admin) plus any of `name`, `email`, `role`, `is_active`
- `DELETE /api/users/:id` — body: `{ "currentPassword": "..." }` (soft deactivate; cannot target primary admin or yourself)

### Financial Records
- `GET /api/records?page=1&limit=10` (viewer scoped to own, analyst/admin all) + filters
- `GET /api/records/:id` (viewer own only, analyst/admin all)
- `POST /api/records` (admin)
- `PATCH /api/records/:id` (admin)
- `DELETE /api/records/:id` (admin) — **soft delete** (`deleted = true`); row hidden from lists and dashboard math

Supported filters in list:
- `type` (`income` / `expense`)
- `category` (partial match, case-insensitive)
- `search` (matches **notes** or **category**, case-insensitive)
- `from` (YYYY-MM-DD)
- `to` (YYYY-MM-DD)
- `page`
- `limit` (default **10** on the server)

Pagination response includes:
- `rows`
- `page`
- `limit`
- `total`
- `totalPages`

### Dashboard (all authenticated roles)
- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent?limit=10`
- `GET /api/dashboard/categories` (analyst/admin only)
- `GET /api/dashboard/trends?months=6` (analyst/admin only)

### Categories
- `GET /api/categories` (all roles)
- `POST /api/categories` (admin only)
- `DELETE /api/categories/:id` (admin only)

## Request Examples

### Register first admin
`POST /api/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

### Login
`POST /api/auth/login`
```json
{
  "email": "admin@example.com",
  "password": "Admin@1234"
}
```

### Create financial record (admin)
`POST /api/records`
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "record_date": "2026-04-01",
  "notes": "April salary"
}
```

## Frontend (Basic)

`frontend/index.html` is a simple local test UI.

Run quickly with VS Code Live Server or any static server.
It calls backend on `http://localhost:5000/api`.

