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
