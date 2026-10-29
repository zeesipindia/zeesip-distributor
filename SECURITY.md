# Zee Sip Portal — Security Architecture & Guidelines

## 1. MANDATORY RULE FOR ALL FUTURE MODULES
> **CRITICAL SECURITY REQUIREMENT:**
> Every query for user data must filter by the session user ID (`session.userId`) on the server.
>
> - Never trust a user ID passed in client request bodies, query parameters, or URL route segments without verifying it strictly matches `session.userId` (unless the caller possesses an authorized admin role: `admin` or `zeesip_admin`).
> - Regular users (e.g. `distributor`, `zeesip_staff`) must NEVER be able to query, mutate, export, or delete records belonging to another distributor or user.
> - Always retrieve and verify the caller's session on the server via `verifySessionToken(token)` before executing database queries.

---

## 2. Authentication & Session Management
- **Single Password Entry (`/`)**:
  - The master administrator password is verified using constant-time SHA-256 comparison (`crypto.timingSafeEqual`) against `process.env.ADMIN_PASSWORD`.
  - Portal users are verified via deterministic HMAC-SHA256 lookup (`PASSWORD_PEPPER`) followed by `bcrypt.compare`.
  - Passwords are strictly unique across all users and cannot match `ADMIN_PASSWORD`.
- **Session Cookie (`zeesip_session`)**:
  - `httpOnly`: true (JavaScript in the browser cannot read the cookie).
  - `secure`: true in production (`process.env.NODE_ENV === 'production'`).
  - `sameSite`: `'lax'` (prevents cross-site request forgery attacks).
  - `path`: `'/'`
  - Signed with `jose` using HS256 and verified cryptographically on every request.
  - Expiration: 7 days (`maxAge: 604800`).
- **Logout (`/api/auth/logout`)**:
  - Accepts `POST` requests only. Clears the session cookie immediately (`maxAge: 0`).

---

## 3. Persistent Rate Limiting
- Backed by the Supabase `login_attempts` table (not stored in ephemeral process memory).
- Tracks failed login attempts per client IP.
- The client IP is extracted from the first entry of the `x-forwarded-for` header for Render deployments, with safe fallback to `x-real-ip` or `cf-connecting-ip`.
- **Enforcement**: 5 failed login attempts triggers an automatic 15-minute lockout. Counter is reset to zero on any successful login.

---

## 4. Authorization & HTTP Status Codes
- **401 Unauthorized**: Returned when a request is unauthenticated (missing or invalid session token).
- **403 Forbidden**: Returned when a user is authenticated, but their assigned role lacks the required privilege for an admin route (e.g., a `distributor` attempting to call `/api/admin/*`).
- **Active State Revocation**: If an account's `is_active` flag is set to `false`, access is immediately revoked in real time on both `/api/auth/me` and `/dashboard`.

---

## 5. Database & Environment Security
- **Row Level Security (RLS)**:
  - Enabled on `portal_users` and `login_attempts`.
  - Zero public policies exist. Anon/publishable keys cannot read or write to these tables.
  - All operations are executed server-side via `SUPABASE_SERVICE_ROLE_KEY`.
- **Secrets Isolation**:
  - `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `PASSWORD_PEPPER`, and `SESSION_SECRET` are strictly server-side environment variables.
  - Never prefix sensitive credentials with `NEXT_PUBLIC_` or import them into client components.

---

## 6. HTTP Security Headers
Configured in `next.config.ts`:
- `X-Frame-Options`: `DENY`
- `X-Content-Type-Options`: `nosniff`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy`: Standard Next.js compatible policy preventing script injection.
