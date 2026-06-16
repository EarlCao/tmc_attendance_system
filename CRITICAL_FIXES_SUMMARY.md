# Critical Fixes Summary

**Project:** TMC Choir Attendance System
**Date:** 2026-06-16
**Scope:** This pass addresses **Critical-severity issues only**. High / Medium / Low issues were intentionally left untouched.
**Validation:** All modified backend files pass `node --check` (syntax), and the changes were reviewed by an automated code review with no blocking issues. The backup export → import round-trip remains valid because the exporter only emits the whitelisted statement shapes.

> `PRE_DEPLOY_REVIEW.md` and `CRITICAL_FIXES.md` were **not** modified.

---

## Critical Issues Found & Fixed

### C-1 — Arbitrary SQL execution via backup import
**Was:** `importBackup` ran every uploaded statement through `$executeRawUnsafe`, gated only by a forgeable text marker (effectively DB-level RCE).
**Fixed:** Added a strict statement **whitelist** (`validateStatement`) that allows only the exporter-generated shapes — `TRUNCATE TABLE ...`, `INSERT INTO ...`, and `SELECT setval(...)` — and validates that every referenced table belongs to the known table set. Any other statement causes the entire import to be rejected with a `400`. Also lowered the request body limit from **50 MB → 5 MB**.

### C-2 — `passwordHash` leaked through `/api/auth/me`
**Was:** `protect` assigned the full user record (including `passwordHash`) to `req.user`, which `getMe` returned verbatim.
**Fixed:** `protect` now strips `passwordHash` (`const { passwordHash, ...safeUser } = currentUser`) before assigning `req.user`, protecting every route that serializes `req.user`.

### C-3 — Socket.IO had no authentication and broadcast PII
**Was:** Any client could connect with no auth and receive live member/auditionee PII.
**Fixed:** Added an `io.use(...)` JWT handshake middleware that verifies `socket.handshake.auth.token` (or `Authorization` header) and rejects unauthenticated sockets. The client now sends the token via an `auth` callback and (re)connects on login / disconnects on logout.

### C-4 — Hardcoded / shared default passwords
**Was:** Seed admin used `admin123`; every auto-created member account shared the constant `tmc2026`.
**Fixed:**
- Seed admin password is now read from `SEED_ADMIN_PASSWORD` (the seed throws if it's missing) and hashed at cost **12**.
- Auto-created member accounts now get a **unique random temporary password** (`generateTempPassword`), returned once in the API response so an admin can relay it. bcrypt cost raised to **12** everywhere via a shared `BCRYPT_COST` constant.

### C-5 — Member deletion threw a foreign-key error
**Was:** `deleteMember` deleted the linked user then the member, but not the member's `AttendanceRecord` / `Officer` rows (no cascade), failing with a FK violation and leaving partial state.
**Fixed:** Deletion is now wrapped in a single `prisma.$transaction([...])` that removes `attendanceRecord`, `officer`, `user`, then `member` atomically.

### C-6 — Inconsistent role casing stored in the database
**Was:** Roles were stored as a mix of `ADMIN` / `admin` / `member`, relying on ad-hoc `.toUpperCase()` checks — a latent privilege bug. `createAccount` also trusted an arbitrary `role` from the request body.
**Fixed:** Added `canonicalizeRole()` + `ROLES` allow-list. `createAccount` / `updateAccount` now canonicalize role to `ADMIN` / `MEMBER` and **reject** unknown roles with a `400`. Auto-created member accounts now store the canonical `MEMBER`.

### C-7 — Production secrets documented & not enforced at startup
**Was:** No startup assertion for required env vars; README/`.env.example` shipped weak example secrets and a broken `[TEMPLATE]` header.
**Fixed:**
- Added a **fail-fast env guard** in `server.js` that exits if `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, or `JWT_EXPIRES_IN` is missing, and rejects a `JWT_SECRET` shorter than 32 chars in production.
- Rewrote `.env.example` into a complete, valid template (added `FRONTEND_URL`, `NODE_ENV`, `SEED_ADMIN_PASSWORD`, `VITE_API_URL`; removed the `[TEMPLATE]` header).
- Updated `README.md` to remove the weak `supersecretkey` guidance, document `openssl rand -base64 48`, and correct the Postgres/secret env table.

---

## Files Modified

| File | Critical issue(s) | Change |
|------|-------------------|--------|
| `server-tmc-choir-system/src/controller/backup.controller.js` | C-1 | Statement whitelist + identifier validation before execution |
| `server-tmc-choir-system/src/routes/backup.route.js` | C-1 | Import body limit 50 MB → 5 MB |
| `server-tmc-choir-system/src/middleware/auth.middleware.js` | C-2 | Strip `passwordHash` from `req.user` |
| `server-tmc-choir-system/src/socket/index.js` | C-3 | JWT auth handshake middleware |
| `client-tmc-choir-system/src/lib/socket.js` | C-3 | Send token via `auth`; `connectSocket` / `disconnectSocket` helpers; no auto-connect without token |
| `client-tmc-choir-system/src/context/AuthContext.jsx` | C-3 | Connect socket on login, disconnect on logout |
| `server-tmc-choir-system/src/lib/security.js` *(new)* | C-4, C-6 | `BCRYPT_COST`, `ROLES`, `canonicalizeRole`, `generateTempPassword` |
| `server-tmc-choir-system/prisma/seed.js` | C-4 | Env-based admin password (`SEED_ADMIN_PASSWORD`), cost 12 |
| `server-tmc-choir-system/src/controller/member.controller.js` | C-4, C-5, C-6 | Random temp password, transactional delete, canonical `MEMBER` role |
| `server-tmc-choir-system/src/controller/account.controller.js` | C-4, C-6 | Random temp password, role canonicalize/validate, `BCRYPT_COST` |
| `server-tmc-choir-system/src/server.js` | C-7 | Fail-fast required-env guard |
| `.env.example` | C-7 | Complete, valid env template |
| `README.md` | C-7 | Removed weak-secret guidance; corrected env/Postgres docs |

---

## Follow-up Notes (not done in this Critical-only pass)

- A schema-level fix for C-5/C-6 (adding `onDelete: Cascade` and a `Role` enum + data migration) is recommended but deferred — the current fixes are migration-free and behavior-preserving.
- A forced first-login password change (`mustChangePassword`) is a recommended enhancement for C-4 but requires a schema migration and login-flow change.
- Legacy MySQL-format backup files now return a generic `400` (rejected by the whitelist) rather than the older "incompatible format" message — safer, but slightly less descriptive.
- High / Medium / Low issues from `PRE_DEPLOY_REVIEW.md` remain open and were intentionally not addressed in this pass.

*End of summary.*

---

# HIGH-LEVEL FIXES

**Date:** 2026-06-16
**Scope:** This pass addresses **High-severity issues only** (H-1 through H-11 from `PRE_DEPLOY_REVIEW.md`). Medium / Low issues were intentionally left untouched, and all Critical fixes above remain unchanged.
**Validation:** All modified backend files pass `node --check` (syntax), and the changes were reviewed by an automated code review with no blocking issues. The new Prisma migration is additive and nullable, so it is safe to apply to existing databases.

> `PRE_DEPLOY_REVIEW.md`, `CRITICAL_FIXES.md`, and the Critical section above were **not** modified.

---

## High Issues Found & Fixed

### H-1 — Global rate limiting was disabled
**Was:** `app.use("/api", globalLimiter)` was commented out, leaving every API route open to brute-force / scraping / DoS.
**Fixed:** Re-enabled the global limiter on `/api`. Works correctly behind the proxy because of the `trust proxy` change (H-8).

### H-2 — CORS / Socket.IO accepted a single (or undefined) origin
**Was:** CORS and Socket.IO used a single `FRONTEND_URL` string; a misconfiguration could open the API to any origin.
**Fixed:** `FRONTEND_URL` is now parsed into a trimmed, comma-separated **allow-list** (`ALLOWED_ORIGINS`) and passed to both `cors({ origin })` and the Socket.IO `cors.origin`. Combined with the Critical-pass startup guard, the origin can never be `undefined`.

### H-3 — JWT stored in `localStorage` (XSS token theft risk)
**Was:** The access token lives in `localStorage`, readable by any injected script.
**Fixed (mitigation):** Configured Helmet with a strict **Content-Security-Policy** (locks `scriptSrc`/`objectSrc`/`frameAncestors`) and explicit **HSTS** to materially reduce XSS impact. A full migration to `httpOnly` cookies (which would touch login/logout, `protect`, axios, and the socket handshake) is documented as a deliberate follow-up rather than performed here, to keep this pass minimal and safe.

### H-4 — Attendance-rate hack overwrote `Member.notes` (data loss)
**Was:** Saving attendance wrote `data: { notes: 'Attendance Rate: X%' }`, destroying any real admin notes; the socket layer even special-cased `notes`-only updates to hide the hack.
**Fixed:** Added a dedicated nullable `attendanceRate Float?` column to `Member` (additive migration `20260616000000_add_member_attendance_rate`). `saveAttendanceForSession` now writes `{ attendanceRate }` instead of repurposing `notes`. The socket extension's broadcast-suppression special-case was updated from `notes`-only to `attendanceRate`-only. `portal.controller` already computes the rate on read, so no change was needed there.

### H-5 — No global error handler / 404; raw error messages leaked
**Was:** Unknown routes and unhandled errors fell through to default Express behavior; the backup import echoed raw `err.message` to clients (info disclosure).
**Fixed:** Added a **404 handler** and a **centralized error-handling middleware** at the end of `server.js` that returns a generic message for 5xx in production and logs details server-side. The backup import `catch` no longer returns raw `err.message`.

### H-6 — Docker images run dev servers in production
**Decision:** Intentionally **skipped** per user direction — production is deployed via **Render** (backend) + **Vercel** (frontend) per `render.yaml`, and the Docker/compose setup is the local-dev workflow. Converting it would break local dev without improving the real production path.

### H-7 — Large import body enabled DoS
**Was:** Backup import accepted very large bodies with no dedicated throttle.
**Fixed:** Body limit was already reduced to 5 MB (Critical pass); added a dedicated stricter **`backupLimiter`** to `POST /api/backup/import` to cap import frequency on top of the global limiter.

### H-8 — Proxy not trusted (wrong client IP)
**Was:** Behind Render/Vercel, `req.ip` reflected the proxy, not the client — breaking per-IP rate limiting and producing inaccurate audit logs.
**Fixed:** `app.set('trust proxy', 1)` in **production only** (avoids trusting spoofed headers in local dev). Explicit **HSTS** configured via Helmet. This also improves audit-log IP accuracy.

### H-9 — Irreversible / lockout-prone admin actions
**Was:** An admin could delete their own account or the last admin (full lockout); clearing the audit log left no trace of who did it.
**Fixed:** `deleteAccount` now blocks **self-deletion** and blocks deleting the **last active `ADMIN`** (counts active admins first → `400`). `clearAuditLogs` now writes a fresh `CLEAR_AUDIT_LOGS` audit entry (who + how many cleared) so the action is never silent.

### H-10 — No password-strength enforcement
**Was:** Accounts could be created/updated with arbitrarily weak passwords.
**Fixed:** Added a shared **`MIN_PASSWORD_LENGTH`** (8) constant and enforced it in `createAccount`, `updateAccount`, and the member portal's `updateProfile` (rejects short passwords with a `400`).

### H-11 — Inconsistent bcrypt cost in the portal
**Was:** `portal.controller` still hashed with the hardcoded cost `10` while the rest of the app used `BCRYPT_COST` (12).
**Fixed:** Replaced the literal `10` with the shared **`BCRYPT_COST`** constant so all password hashing is consistent.

---

## Files Modified (High pass)

| File | High issue(s) | Change |
|------|---------------|--------|
| `server-tmc-choir-system/src/server.js` | H-1, H-2, H-3, H-5, H-8 | Re-enable global limiter; CORS/Socket origin allow-list; Helmet CSP + HSTS; `trust proxy` (prod); 404 + centralized error handler |
| `server-tmc-choir-system/src/middleware/rateLimit.middleware.js` | H-7 | New stricter `backupLimiter` |
| `server-tmc-choir-system/src/routes/backup.route.js` | H-7 | Apply `backupLimiter` to `POST /import` |
| `server-tmc-choir-system/src/socket/index.js` | H-2, H-4 | Accept origins array; suppress `attendanceRate`-only broadcasts (was `notes`-only) |
| `server-tmc-choir-system/prisma/schema.prisma` | H-4 | Add `attendanceRate Float?` to `Member` |
| `server-tmc-choir-system/prisma/migrations/20260616000000_add_member_attendance_rate/migration.sql` *(new)* | H-4 | Additive nullable `attendanceRate` column |
| `server-tmc-choir-system/src/controller/attendance.controller.js` | H-4 | Write rate to `attendanceRate` instead of `notes` |
| `server-tmc-choir-system/src/controller/backup.controller.js` | H-5 | Stop echoing raw `err.message` to clients |
| `server-tmc-choir-system/src/controller/account.controller.js` | H-9, H-10 | Block self-delete & last-admin delete; enforce min password length |
| `server-tmc-choir-system/src/controller/auditLog.controller.js` | H-9 | Log `CLEAR_AUDIT_LOGS` after clearing |
| `server-tmc-choir-system/src/controller/portal.controller.js` | H-10, H-11 | Enforce min password length; use `BCRYPT_COST` |
| `server-tmc-choir-system/src/lib/security.js` | H-10 | New `MIN_PASSWORD_LENGTH` constant |

---

## Follow-up Notes (not done in this High-only pass)

- **H-3 cookie migration:** Moving the JWT to an `httpOnly`, `Secure`, `SameSite` cookie remains the recommended long-term fix; it was deferred as a larger refactor (auth flow + socket handshake).
- **H-4 migration:** Run `npx prisma migrate deploy` (or `prisma generate`) so the Prisma client picks up the new `attendanceRate` field before deploying.
- **H-6:** No code change — production uses Render/Vercel; Docker remains the dev-only workflow per user direction.
- Medium / Low issues from `PRE_DEPLOY_REVIEW.md` remain open and were intentionally not addressed in this pass.

*End of high-level summary.*
