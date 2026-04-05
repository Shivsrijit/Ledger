# Deploy: Vercel (frontend) + Render (backend)

This guide assumes **Supabase Postgres** (or any Postgres URL) and a **Git** repo (GitHub/GitLab/Bitbucket) connected to both hosts.

---

## 1. Deploy the backend on Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your repository.
3. Configure:
   - **Root directory:** `backend`
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start` (runs `node src/server.js`)
4. **Environment variables** (Render dashboard → Environment):

   | Variable | Example / notes |
   | -------- | ---------------- |
   | `NODE_ENV` | `production` |
   | `SUPABASE_DB_URL` | Postgres connection URI (password URL-encoded if needed) |
   | `JWT_SECRET` | Long random string |
   | `JWT_EXPIRES_IN` | e.g. `1d` |
   | `DB_SSL` | `true` for Supabase (omit or `false` only for local Postgres without TLS) |
   | `TRUST_PROXY` | `1` — recommended so rate limiting and IPs work behind Render’s proxy (see backend `app.js`) |
   | `PORT` | Usually **do not set**; Render injects `PORT` automatically |

5. Run **database schema / migrations** once against the same database (from your machine or a one-off job):

   ```bash
   cd backend
   # Set SUPABASE_DB_URL in .env or export it, then:
   npm run db:migrate
   ```

6. After deploy, note your service URL, e.g. `https://ledger-api.onrender.com`.

**Health check:** open `https://YOUR-SERVICE.onrender.com/api/health`.

---

## 2. Deploy the frontend on Vercel

1. Import the project in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend` (or configure a monorepo accordingly).
3. **Build settings:**
   - **Framework preset:** Vite  
   - **Build command:** `npm run build`  
   - **Output directory:** `dist`
4. **Environment variable** (Vercel → Project → Settings → Environment Variables):

   | Name | Value |
   | ---- | ----- |
   | `VITE_API_BASE` | `https://YOUR-SERVICE.onrender.com/api` |

   Important: **include `/api` at the end.** The app calls paths like `/auth/login` and prepends `VITE_API_BASE`, so the full URL becomes `https://…onrender.com/api/auth/login`.

5. Deploy. Your site will be something like `https://your-app.vercel.app`.

---

## 3. CORS

The backend uses `cors()` with default settings (allows any origin). That is fine for many demos. For production hardening, restrict origins to your Vercel URL:

```js
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
```

Then set `FRONTEND_URL=https://your-app.vercel.app` on Render.

---

## 4. Cold starts (Render free tier)

Free Render web services **spin down** after idle time. The first request after sleep can take **30–60+ seconds**. For demos, upgrade to a paid instance or accept the delay.

---

## 5. Checklist

- [ ] Postgres reachable from Render (Supabase: allow connections; use correct URI).
- [ ] `npm run db:migrate` (and schema/seed if you use them) applied to production DB.
- [ ] `JWT_SECRET` set and not committed to git.
- [ ] `VITE_API_BASE` on Vercel points to **Render URL + `/api`**.
- [ ] `TRUST_PROXY=1` on Render if you enabled it in the app.

---

## 6. Optional: custom domain

- **Vercel:** Project → Domains → add your domain.  
- **Render:** Service → Settings → Custom Domain for the API.

Update `VITE_API_BASE` and `FRONTEND_URL` / CORS to match.
