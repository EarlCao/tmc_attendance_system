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

---

# MEDIUM-LEVEL FIXES

**Date:** 2026-06-16
**Scope:** This pass addresses **Medium-severity issues only** (M-1 through M-12 from `PRE_DEPLOY_REVIEW.md`). Low-priority issues were intentionally left untouched, and all Critical / High fixes above remain unchanged.
**Validation:** All modified backend files pass `node --check` (syntax) and were reviewed by an automated code review. All changes are backward-compatible — no API response shapes change unless new opt-in query params are supplied, so the existing frontend continues to work unmodified.

> `PRE_DEPLOY_REVIEW.md`, `CRITICAL_FIXES.md`, and the Critical / High sections above were **not** modified.

---

## Medium Issues Found & Fixed

### M-1 — No input validation framework
**Was:** Controllers used inconsistent ad-hoc `if (!x)` checks; `parseInt(id)` on malformed input produced `NaN`, reaching Prisma and surfacing confusing 500s.
**Fixed (lightweight hardening, no framework):** Added a shared **`parseId(value)`** helper in `security.js` that returns a positive integer or `null`. Applied it to id parsing in `member` (update/delete), `session` (getSession), `audition` (delete), and `account` (update/delete) controllers — invalid ids now return a clean `400`. A full Zod/Joi layer was deliberately **not** adopted to keep this pass minimal and safe (documented as a follow-up).

### M-2 — Case-sensitive search
**Was:** `contains` filters in `member` (`searchMembers`), `session` (`getSessions`), and `audition` (`getAuditionees`) lacked `mode: 'insensitive'`, making searches case-sensitive and inconsistent with the audit-log search.
**Fixed:** Added `mode: 'insensitive'` to every text `contains` filter in those three controllers.

### M-3 — Manual, non-atomic cascade deletes
**Was:** `deleteJudge` and `deleteAuditionee` walked `evaluationScore` → `judgeEvaluation` → parent with sequential awaits; a partial failure could orphan rows.
**Fixed:** Wrapped each multi-step delete in a single **`prisma.$transaction([...])`** (conditionally including the dependent-row deletes), so the whole cascade is atomic. (Schema-level `onDelete: Cascade` remains a deferred, migration-requiring follow-up.)

### M-4 — Incomplete `.env.example`
**Already fixed in the Critical pass** (added `FRONTEND_URL`, `NODE_ENV`, `SEED_ADMIN_PASSWORD`, `VITE_API_URL`; removed the stray `[TEMPLATE]` header). No change needed here.

### M-5 — Stale README (said MySQL / wrong ports)
**Already fixed in the Critical pass** (rewritten for PostgreSQL, corrected secret guidance). No change needed here.

### M-6 — Port inconsistency across configs
**Was:** `server.js` defaulted to `3002` while `render.yaml` and the Dockerfile use `3302`.
**Fixed:** Changed the `server.js` default `BACKEND_PORT` to **`3302`** so all configs agree (the env var still overrides).

### M-7 — Category percentages not validated to sum to 100
**Was:** Weighted-average computation divided by the total weight, so percentages that didn't sum to 100 produced misleading "averages," and individual percentages were unbounded.
**Fixed:** `createCategory` / `updateCategory` now reject a `percentage` outside **0–100** with a `400`. `getCategories` additionally returns **`totalPercentage`** and a non-blocking **`percentageWarning`** (additive fields only) so the UI can surface a warning when weights don't sum to 100%.

### M-8 — Double socket emit on member creation
**Was:** `createMember` manually emitted `user:created` while the socket-aware Prisma extension also emits it on `prisma.user.create` — duplicate client events.
**Fixed:** Removed the manual `emit('user:created', ...)` from `createMember` (the extension already broadcasts it). The `user:deleted` emits in `deleteMember` were **kept** because that path uses `deleteMany`, which the extension does not intercept.

### M-9 — `req.ip` unreliable behind proxy
**Already fixed in the High pass** via `app.set('trust proxy', 1)` in production. No change needed here.

### M-10 — Backup date format omitted explicit timezone
**Was:** `escapeValue` stripped the trailing `Z`, serializing dates as a naive UTC wall-clock.
**Fixed:** Now appends an explicit **`+00`** offset instead of stripping `Z`, documenting the values as UTC. *Note:* the `DateTime` columns are `timestamp without time zone`, so Postgres discards the offset on insert — stored values are identical to before and the round-trip test (which compares row counts) is unaffected. This change is clarifying/intent-preserving rather than a behavioral fix; a true timezone fix would require migrating to `timestamptz`.

### M-11 — No pagination on list endpoints
**Was:** `getMembers`, `getSessions`, `getAuditionees`, and `getAccounts` always returned full tables with deep includes.
**Fixed (opt-in, backward-compatible):** Each endpoint now applies `skip`/`take` and returns a `pagination` metadata object **only when `?page` or `?pageSize` is supplied**; otherwise it returns the full array under the existing key, so the current frontend is unaffected. `pageSize` is capped at **200** to preserve DoS protection. *Note:* `getAccounts` paginates the assembled admin+member list in memory (it reduces payload size, not DB load) because that list is merged from two queries.

### M-12 — Portal routes not explicitly role-guarded
**Was:** `portal.route.js` used only `protect`, conflating "has a memberId" with "is a member."
**Fixed:** Added **`restrictTo('MEMBER')`** after `protect` so portal routes explicitly require an authenticated member.

---

## Files Modified (Medium pass)

| File | Medium issue(s) | Change |
|------|-----------------|--------|
| `server-tmc-choir-system/src/lib/security.js` | M-1 | New `parseId` helper |
| `server-tmc-choir-system/src/controller/member.controller.js` | M-1, M-2, M-8, M-11 | `parseId` on update/delete; insensitive search; removed duplicate emit; opt-in pagination |
| `server-tmc-choir-system/src/controller/session.controller.js` | M-1, M-2, M-11 | `parseId` on getSession; insensitive search; opt-in pagination |
| `server-tmc-choir-system/src/controller/audition.controller.js` | M-1, M-2, M-3, M-11 | `parseId` on delete; insensitive search; transactional delete; opt-in pagination |
| `server-tmc-choir-system/src/controller/judge.controller.js` | M-3 | Transactional cascade delete |
| `server-tmc-choir-system/src/controller/category.controller.js` | M-7 | Percentage 0–100 validation; `totalPercentage` + `percentageWarning` |
| `server-tmc-choir-system/src/controller/account.controller.js` | M-1, M-11 | `parseId` on update/delete; opt-in pagination |
| `server-tmc-choir-system/src/controller/backup.controller.js` | M-10 | Explicit `+00` UTC offset in date serialization |
| `server-tmc-choir-system/src/server.js` | M-6 | Default port `3002` → `3302` |
| `server-tmc-choir-system/src/routes/portal.route.js` | M-12 | `restrictTo('MEMBER')` guard |

---

## Follow-up Notes (not done in this Medium-only pass)

- **M-1:** A full schema-based validation layer (Zod/Joi) per route remains a recommended follow-up; this pass only added lightweight id hardening per the chosen scope.
- **M-3:** Schema-level `onDelete: Cascade` (with a migration) would be cleaner than the transactional manual deletes, but was deferred to avoid a migration in this pass.
- **M-10:** A real timezone fix requires migrating `DateTime` columns to `timestamptz`; the current change only makes the UTC intent explicit.
- **M-11:** Pagination is opt-in; wiring the frontend list views to use `?page`/`?pageSize` (and projecting fewer fields via `select`) is a follow-up enhancement.
- Low-priority issues from `PRE_DEPLOY_REVIEW.md` remain open and were intentionally not addressed in this pass.

*End of medium-level summary.*

---

# LOW-LEVEL FIXES

**Date:** 2026-06-16
**Scope:** This pass addresses **Low-severity issues only** (L-1 through L-9 from `PRE_DEPLOY_REVIEW.md`). All Critical / High / Medium fixes above remain unchanged.
**Validation:** All modified backend files pass `node --check` (syntax), `npx prisma validate` reports the schema is valid, and the changes were reviewed by an automated code review with no blocking issues. The new Prisma migration is additive and nullable, so it is safe to apply to existing databases. No existing API response shapes changed (the `reviewedAt` field already existed in the excuses payload; it is now backed by a real column instead of a wrong fallback).

> `PRE_DEPLOY_REVIEW.md`, `CRITICAL_FIXES.md`, and the Critical / High / Medium sections above were **not** modified.

---

## Low Issues Found & Fixed

### L-1 — Dead code (commented-out `globalLimiter`, `setPrisma` indirection)
**Was:** `globalLimiter` was imported but commented out; `setPrisma` was flagged as added complexity.
**Resolution:** The commented-out `globalLimiter` was **already re-enabled** in the High pass (H-1), so the dead code no longer exists. `setPrisma` is **intentional, not dead code** — it is the seam that lets `server.js` swap in the socket-aware Prisma client (`createSocketAwarePrisma`) at startup while controllers import a stable `prisma` binding. It is kept as-is; no change needed.

### L-2 — Excessive `console.log` in Socket.IO
**Was:** `socket/index.js` logged every connect / join / leave / disconnect, which is noisy and leaks socket IDs in production.
**Fixed:** Added a small leveled `socketLog(...)` helper that only logs when `NODE_ENV !== 'production'`. All connection/room/disconnect logs (and the "Initialized" line) now route through it, silencing them in production while keeping them for local debugging.

### L-3 — Incorrect `reviewedAt` on excuses
**Was:** `getExcuses` used `session.createdAt` as the excuse review timestamp — semantically wrong (it's the session's creation time, not when the excuse was reviewed).
**Fixed:** Added a dedicated nullable **`reviewedAt DateTime?`** column to `AttendanceRecord` (additive migration `20260616010000_add_attendance_reviewed_at`). `updateExcuseStatus` now stamps `reviewedAt = new Date()` whenever an excuse transitions out of `Pending`, and `getExcuses` reports the real `reviewedAt` (null until actually reviewed).

### L-4 — Magic strings for statuses
**Was:** Status values (`'PRESENT'`, `'EXCUSED'`, `'Approved'`, `'Pending'`, etc.) were duplicated as inline string literals.
**Fixed (conservatively scoped):** Added a shared **`src/lib/constants.js`** exposing frozen `ATTENDANCE_STATUS` and `EXCUSE_STATUS` maps, and applied them throughout `attendance.controller.js` (status mapping, excuse filtering, rate calculation, excuse review). Per the "avoid unnecessary refactoring" guidance, the constants were applied only to the controller that concentrates these strings; other controllers were left untouched and can adopt the same module incrementally.

### L-5 — `TestingNoticeModal` says the app is "not yet ready"
**Decision:** Intentionally **left as-is** per user direction — the testing notice remains a deliberate UX choice and was not removed in this pass.

### L-6 — `getMe` redundancy
**Was:** Noted that `getMe` re-fetches the user even though `protect` already loaded it.
**Resolution:** No real redundancy exists server-side — `getMe` simply returns the already-loaded (and `passwordHash`-stripped, per C-2) `req.user` without an extra query. Documented as a non-issue; no change made.

### L-7 — Mixed router import styles / inconsistent file naming
**Was:** Most route files used `import { Router } from 'express'` while `account.route.js`, `auditLog.route.js`, and `portal.route.js` used `express.Router()`; file naming also mixes `auth.routes.js` with `*.route.js`.
**Fixed:** Standardized those three files on the majority **`import { Router } from 'express'`** style for consistency. File **renaming** (`auth.routes.js` → `auth.route.js`) was intentionally **deferred** to avoid churn on the corresponding import in `server.js` for a purely cosmetic gain (documented as a follow-up).

### L-8 — Naive last-name parsing in `formatMember`
**Was:** `formatMember` split `fullName` on whitespace and treated only the final token as the surname, mislabeling compound surnames (e.g. "Juan Dela Cruz" → last name "Cruz").
**Fixed:** Improved the in-place parser to recognize common multi-word surname prefixes (`dela`, `del`, `van`, `von`, `de`, `san`, `mac`, `mc`, etc.) so compound surnames are captured ("Juan Dela Cruz" → first "Juan", last "Dela Cruz"). This stays display-only; a true fix (separate `firstName`/`lastName` columns with backfill + frontend changes) was deferred as a larger change.

### L-9 — Shallow `/health` check
**Was:** `/health` returned a static `{ status: 'ok' }` without verifying the app could actually serve requests.
**Fixed:** `/health` now runs a lightweight `SELECT 1` against Postgres via Prisma. It returns `200 { status: 'ok', db: 'up' }` on success and `503 { status: 'error', db: 'down' }` when the DB is unreachable, so load balancers / uptime checks reflect real readiness.

---

## Files Modified (Low pass)

| File | Low issue(s) | Change |
|------|--------------|--------|
| `server-tmc-choir-system/src/socket/index.js` | L-2 | `socketLog` helper gates connection/room logs to non-production |
| `server-tmc-choir-system/prisma/schema.prisma` | L-3 | Add `reviewedAt DateTime?` to `AttendanceRecord` |
| `server-tmc-choir-system/prisma/migrations/20260616010000_add_attendance_reviewed_at/migration.sql` *(new)* | L-3 | Additive nullable `reviewedAt` column |
| `server-tmc-choir-system/src/controller/attendance.controller.js` | L-3, L-4 | Stamp/read real `reviewedAt`; use `ATTENDANCE_STATUS` / `EXCUSE_STATUS` constants |
| `server-tmc-choir-system/src/lib/constants.js` *(new)* | L-4 | Shared `ATTENDANCE_STATUS` / `EXCUSE_STATUS` constants |
| `server-tmc-choir-system/src/controller/member.controller.js` | L-8 | Multi-word surname-aware `formatMember` parsing |
| `server-tmc-choir-system/src/server.js` | L-9 | `/health` now pings the DB (`SELECT 1`), 503 on failure |
| `server-tmc-choir-system/src/routes/account.route.js` | L-7 | `express.Router()` → `import { Router }` |
| `server-tmc-choir-system/src/routes/auditLog.route.js` | L-7 | `express.Router()` → `import { Router }` |
| `server-tmc-choir-system/src/routes/portal.route.js` | L-7 | `express.Router()` → `import { Router }` |

---

## Follow-up Notes (not done in this Low-only pass)

- **L-3:** Run `npx prisma migrate deploy` (or `prisma generate`) so the Prisma client picks up the new `reviewedAt` field before deploying. Pre-existing excuses reviewed before this change will report `reviewedAt: null` (the previous value was incorrect anyway).
- **L-4:** Magic-string constants were applied only in `attendance.controller.js`; other controllers (`portal`, `member`, `audition`, etc.) can adopt `src/lib/constants.js` incrementally.
- **L-5:** No change — `TestingNoticeModal` retained per user direction.
- **L-7:** File renaming (`auth.routes.js` → `auth.route.js`) deferred to avoid import churn for a cosmetic gain.
- **L-8:** A robust fix is to store `firstName`/`lastName` as separate columns (with a backfill + frontend updates) instead of parsing `fullName`; deferred as a larger change.

*End of low-level summary.*
