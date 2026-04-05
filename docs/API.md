# Ledger API reference (Postman)

**Base URL (local):** `http://localhost:5000` (or your `PORT` in `backend/.env`).

**API prefix:** All routes below live under `/api` unless stated otherwise.

---

## Conventions

### Headers for JSON requests

```http
Content-Type: application/json
```

### Authentication

Send a JWT for protected routes:

```http
Authorization: Bearer <JWT>
```

Obtain `<JWT>` from `POST /api/auth/login` (field `data.token` in the response).

### Response shape

- **Success:** `success: true` plus `data` and/or `message`.
- **Error:** `success: false`, `message`, and optional `details` (e.g. validation).

### Strong password (where required)

Passwords must be at least **10** characters and include **uppercase**, **lowercase**, **a digit**, and a **special character** (e.g. `!@#$`).

---

## Health and root

### GET `/api/health`

- **Authentication:** Not required  
- **Query:** None  
- **Body:** None  

Returns a simple health JSON payload.

### GET `/`

- **Authentication:** Not required  
- **Query:** None  
- **Body:** None  

Root of the server (not under `/api`). Returns API hints.

---

## Auth (`/api/auth`)

### POST `/api/auth/register`

- **Authentication:** Optional Bearer token. **Required** if users already exist (only the very first user can register without a token).  
- **Query:** None  
- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | Yes | 2–100 characters |
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Strong password rules |
| `role` | string | No | One of `viewer`, `analyst`, `admin` (first user becomes admin regardless) |
| `is_active` | boolean | No | Defaults to true |

**Example body:**

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Str0ng!Pass",
  "role": "viewer"
}
```

### POST `/api/auth/login`

- **Authentication:** Not required  
- **Query:** None  
- **Body:** JSON (required)

| Field | Type | Required |
| ----- | ---- | -------- |
| `email` | string | Yes |
| `password` | string | Yes |

**Example:**

```json
{
  "email": "ada@example.com",
  "password": "Str0ng!Pass"
}
```

Response includes `data.token` and `data.user`.

### GET `/api/auth/me`

- **Authentication:** Bearer (required)  
- **Query:** None  
- **Body:** None  

### PATCH `/api/auth/password`

Change your own password (any role).

- **Authentication:** Bearer (required)  
- **Query:** None  
- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `currentPassword` | string | Yes | Current password |
| `newPassword` | string | Yes | Strong password; must differ from `currentPassword` |

**Example:**

```json
{
  "currentPassword": "OldStr0ng!Pass",
  "newPassword": "NewStr0ng!Pass"
}
```

---

## Dashboard (`/api/dashboard`)

All endpoints below require **Bearer** authentication. Roles: **admin**, **analyst**, or **viewer**.

### GET `/api/dashboard/summary`

- **Query:** None  
- **Body:** None  

### GET `/api/dashboard/recent`

- **Query parameters:**

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `limit` | No | Integer; default 10 |

Example: `GET /api/dashboard/recent?limit=20`

### GET `/api/dashboard/categories`

- **Query:** None  
- **Body:** None  

### GET `/api/dashboard/trends`

- **Query parameters:**

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `granularity` | No | `month` (default) or `week` |
| `periods` | No | Integer 1–36 (months or weeks to include) |

Example: `GET /api/dashboard/trends?granularity=week&periods=12`

---

## Records (`/api/records`)

All requests require **Bearer** authentication.

- **GET** — roles **admin** or **analyst**
- **POST**, **PATCH**, **DELETE** — **admin** only

### GET `/api/records`

- **Query parameters:**

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `page` | No | Integer ≥ 1, default 1 |
| `limit` | No | Integer 1–100, default 10 |
| `type` | No | `income` or `expense` |
| `category` | No | String, max 100 chars (partial match) |
| `from` | No | Date `YYYY-MM-DD` |
| `to` | No | Date `YYYY-MM-DD` |
| `search` | No | String, max 200 (notes or category) |

Example: `GET /api/records?page=1&limit=10&search=rent&type=expense`

### GET `/api/records/:id`

- **Path:** `id`  positive integer (record id)  
- **Query:** None  
- **Body:** None  

Example: `GET /api/records/42`

### POST `/api/records`

- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `amount` | number | Yes | Greater than 0 |
| `type` | string | Yes | `income` or `expense` |
| `category` | string | Yes | 2–100 characters |
| `record_date` | string | Yes | Date (e.g. `YYYY-MM-DD`) |
| `notes` | string or null | No | Max 500 characters |

**Example:**

```json
{
  "amount": 125.5,
  "type": "expense",
  "category": "Office",
  "record_date": "2026-04-05",
  "notes": "Supplies"
}
```

### PATCH `/api/records/:id`

- **Path:** `id`  record id  
- **Body:** JSON :  at least one field required

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `amount` | number | No | Must be &gt; 0 if present |
| `type` | string | No | `income` or `expense` |
| `category` | string | No | 2–100 characters if present |
| `record_date` | string | No | Valid date |
| `notes` | string or null | No | Max 500 characters |

**Example:**

```json
{
  "amount": 130,
  "notes": "Updated amount"
}
```

### DELETE `/api/records/:id`

- **Path:** `id`  record id  
- **Body:** None  

Soft-deletes (archives) the record.

---

## Users  team (`/api/users`)

All routes require **Bearer** authentication and **admin** role.

### GET `/api/users`

- **Query parameters:**

| Parameter | Required | Description |
| --------- | -------- | ----------- |
| `page` | No | Integer ≥ 1 |
| `limit` | No | Integer 1–100 |
| `search` | No | String, max 200 (name or email) |

Example: `GET /api/users?page=1&limit=10&search=ada`

### POST `/api/users`

- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | Yes | 2–100 characters |
| `email` | string | Yes | Valid email |
| `password` | string | Yes | Strong password (initial password) |
| `role` | string | Yes | One of `viewer`, `analyst`, `admin` |
| `is_active` | boolean | No | Defaults to true |

### GET `/api/users/:id`

- **Path:** `id` user id (positive integer)  
- **Query:** None  
- **Body:** None  

### PATCH `/api/users/:id`

- **Path:** `id` target user id  
- **Body:** JSON : include `currentPassword` plus at least one other field below

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `currentPassword` | string | Yes | Your admin password |
| `name` | string | No | 2–100 characters |
| `email` | string | No | Valid email |
| `role` | string | No | One of `viewer`, `analyst`, `admin` |
| `is_active` | boolean | No | Active flag |

**Example:**

```json
{
  "currentPassword": "YourAdmin!Pass",
  "role": "analyst",
  "is_active": true
}
```

### PATCH `/api/users/:id/password`

Set password for a **viewer** or **analyst** (not for another **admin**; they use `/api/auth/password`). You may target your own admin id, but self-service is normally `/api/auth/password`.

- **Path:** `id` target user id  
- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `currentPassword` | string | Yes | Your admin password |
| `newPassword` | string | Yes | Strong password; must differ from `currentPassword` |

**Example:**

```json
{
  "currentPassword": "YourAdmin!Pass",
  "newPassword": "TheirNew!Pass123"
}
```

### DELETE `/api/users/:id`

Deactivate user (`is_active: false`). Cannot deactivate the primary admin or yourself (see API errors).

- **Path:** `id` target user id  
- **Body:** JSON (required)

| Field | Type | Required |
| ----- | ---- | -------- |
| `currentPassword` | string | Yes |

**Example:**

```json
{
  "currentPassword": "YourAdmin!Pass"
}
```

### POST `/api/users/:id/remove`

Soft-remove user from the organization. Primary admin cannot be removed. A non-primary admin may remove themselves; the app should sign them out and send them to login.

- **Path:** `id` target user id  
- **Body:** JSON (required)

| Field | Type | Required |
| ----- | ---- | -------- |
| `currentPassword` | string | Yes |

**Example:**

```json
{
  "currentPassword": "YourAdmin!Pass"
}
```

---

## Categories (`/api/categories`)

All routes require **Bearer** authentication.

### GET `/api/categories`

- **Roles:** admin, analyst, viewer  
- **Query:** None  
- **Body:** None  

### POST `/api/categories`

- **Roles:** admin only  
- **Body:** JSON (required)

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | Yes | 2–100 characters |

**Example:**

```json
{
  "name": "Travel"
}
```

### DELETE `/api/categories/:id`

- **Roles:** admin only  
- **Path:** `id`category id (positive integer)  
- **Body:** None  

Soft-delete (sets `deleted_at`).

---

## Rate limits

- Global limit on `/api` (see `backend/src/middleware/rateLimit.js` and env vars like `RATE_LIMIT_API_MAX`).
- Stricter limits on login and register.
- Per-user limits on authenticated read and write routes.

---

## Postman checklist

1. Create environment variables: `baseUrl` (e.g. `http://localhost:5000`), `token`.
2. Call **Login** and set `token` from `data.token`.
3. For protected routes: **Authorization** → **Bearer Token** → `{{token}}`.
4. For JSON bodies: **Body** → **raw** → **JSON**; Postman usually sets `Content-Type: application/json` automatically.
