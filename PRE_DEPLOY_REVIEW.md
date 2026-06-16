# Pre-Deployment Production Readiness Review

**Project:** TMC Choir Attendance System
**Stack:** React + Vite (client) · Express 5 + Prisma 7 + PostgreSQL (server) · Socket.IO · JWT auth
**Review date:** 2026-06-16
**Reviewer:** Automated full-codebase audit
**Verdict:** ⛔ **NOT production-ready.** Several **Critical** security and data-integrity issues must be resolved before any public deployment.

> This document is a read-only audit. **No source code was modified.** Each issue includes a severity, an explanation, and a *recommended* fix (not implemented).

---

## Severity Summary

| Severity | Count | Highlights |
|----------|-------|-----------|
| 🔴 Critical | 7 | Arbitrary SQL execution on import, `passwordHash` leaked via `/auth/me`, unauthenticated Socket.IO broadcasting PII, hardcoded default passwords, FK-violating member delete |
| 🟠 High | 11 | Global rate limiter disabled, CORS misconfig risk, JWT in `localStorage`, attendance-rate overwriting `notes`, no global error handler, dev-mode Docker images |
| 🟡 Medium | 12 | No input validation layer, case-sensitive search, manual cascade deletes, missing env vars, stale README, no last-admin guard |
| 🟢 Low | 9 | Dead code, duplicate socket emits, console logging, incorrect `reviewedAt`, magic strings |

---

## 🔴 Critical Issues

### C-1. Arbitrary SQL execution via backup import (`$executeRawUnsafe`)
**Severity:** Critical
**Location:** `server-tmc-choir-system/src/controller/backup.controller.js` → `importBackup`

The import endpoint accepts a raw SQL string (up to 50 MB) and executes **every statement** through `tx.$executeRawUnsafe(stmt)`. The only safeguard is a string check that the file contains `"TMC Choir Attendance System"` and a `TRUNCATE TABLE`. Both are trivially forgeable by including those tokens in a comment. Any authenticated admin (or anyone holding a stolen/forged admin token) can run **arbitrary SQL** — `DROP TABLE`, data exfiltration, privilege escalation, etc. This is effectively remote code execution against the database.

**Recommended fix:**
- Do **not** execute uploaded SQL. Replace the import with a structured JSON backup format that is parsed and re-inserted via the Prisma client (typed `create`/`createMany` inside a transaction), never raw SQL.
- If raw SQL restore must remain, run it via an out-of-band DBA tool (`pg_restore`) — never an HTTP endpoint exposed to the app.
- At minimum, whitelist allowed statement types (only `TRUNCATE`/`INSERT`/`SELECT setval`) and reject anything else, and validate identifiers against the known table list before execution.

---

### C-2. `passwordHash` leaked through `/api/auth/me` (and `req.user` everywhere)
**Severity:** Critical
**Location:** `src/middleware/auth.middleware.js` (`protect`) → `src/controller/auth.controller.js` (`getMe`)

`protect` sets `req.user = currentUser`, where `currentUser` is the **full** Prisma `User` record including `passwordHash`. `getMe` then returns `req.user` verbatim:
```js
res.status(200).json({ status: 'success', data: { user: req.user } });
```
So every call to `/api/auth/me` returns the bcrypt `passwordHash` of the logged-in user to the browser. The login response is sanitized (`user.passwordHash = undefined`), but `/me` is not. The hash is then re-fetched on every page load by `AuthContext`.

**Recommended fix:**
- In `protect`, select only safe fields, or strip `passwordHash` before assigning `req.user` (e.g. `const { passwordHash, ...safe } = currentUser; req.user = safe;`).
- Alternatively, use a Prisma `omit`/`select` in the `findUnique` to never load the hash into memory for request context.

---

### C-3. Socket.IO has no authentication and broadcasts member/account PII
**Severity:** Critical
**Location:** `src/socket/index.js`, `src/lib/prisma.js` (socket-aware extension)

The Socket.IO server accepts **any** connection with no auth handshake. The Prisma extension broadcasts full records globally on every mutation: `member:created`/`member:updated` (names, contact numbers, addresses, religion), `user:created`/`user:updated`, `auditionee:*`, etc. Anyone who can reach the server (CORS `origin` is set, but Socket.IO origin checks are bypassable by non-browser clients) can connect, `join:room` to any room, and silently receive a live feed of personal data.

**Recommended fix:**
- Add a Socket.IO auth middleware (`io.use(...)`) that verifies the JWT from `socket.handshake.auth.token` and rejects unauthenticated sockets.
- Scope broadcasts by role/room (admins vs. members) instead of `io.emit` to all.
- Validate `join:room` requests against the user's permissions.

---

### C-4. Hardcoded / weak default passwords
**Severity:** Critical
**Location:** `prisma/seed.js` (`admin` / `admin123`), `src/controller/member.controller.js` & `account.controller.js` (`tmc2026`)

- The seeded admin uses `admin123`.
- Every auto-created member account is assigned the **same** hardcoded password `tmc2026`. Anyone who knows the naming convention (`firstname.lastname`) and this password can log into any member account.

**Recommended fix:**
- Force a password change on first login (add a `mustChangePassword` flag).
- Generate a random per-account temporary password and deliver it out-of-band; never reuse a shared constant.
- Remove the seeded admin password from source; require it via an env var at seed time.

---

### C-5. Deleting a member with attendance/officer rows throws a FK error (data-integrity bug)
**Severity:** Critical
**Location:** `src/controller/member.controller.js` → `deleteMember`; `prisma/schema.prisma`

`deleteMember` deletes linked `User` rows then the `Member`, but does **not** delete the member's `AttendanceRecord` or `Officer` rows. Neither relation declares `onDelete: Cascade` in the schema (`AttendanceRecord.member`, `Officer.member`). Deleting any member who has ever been marked on attendance (which is **every** active member, since `createSession` auto-creates PRESENT records) will fail with a foreign-key violation and return a generic 500.

**Recommended fix:**
- Either add `onDelete: Cascade` to `AttendanceRecord` → `Member` and `Officer` → `Member` relations (then migrate), or explicitly `deleteMany` those rows inside a `prisma.$transaction` before deleting the member.
- Wrap the multi-step delete in a transaction so partial failures don't leave orphaned state.

---

### C-6. No authorization scoping beyond role; portal trusts client-derived `memberId` only via token (acceptable) but admin-only routes rely on inconsistent role casing
**Severity:** Critical (defense-in-depth / correctness)
**Location:** `src/middleware/auth.middleware.js`, `prisma/seed.js`

`requireAdmin` compares `role.toUpperCase() === 'ADMIN'`. The seed creates the admin with `role: "ADMIN"`, but `createAccount` defaults new admins to `role: 'admin'` (lowercase) and members to `'member'`. The casing is normalized in middleware so it currently works, but the data layer stores **inconsistent role values** (`ADMIN` vs `admin` vs `member`). A single missed `.toUpperCase()` anywhere (e.g. a future direct DB query or the frontend `user.role.toLowerCase()` checks) silently grants or denies access. This is a latent privilege bug.

**Recommended fix:**
- Convert `role` to a Prisma `enum Role { ADMIN MEMBER }` and store a single canonical form everywhere.
- Remove ad-hoc `.toUpperCase()`/`.toLowerCase()` comparisons once the enum guarantees consistency.

---

### C-7. Production secrets and weak config guidance committed/documented
**Severity:** Critical
**Location:** `README.md`, `.env.example`, `render.yaml`

The README documents `JWT_SECRET=supersecretkey` and `admin/passcode` DB credentials as defaults. There is no startup assertion that `JWT_SECRET`, `DATABASE_URL`, and `FRONTEND_URL` are set; if `JWT_SECRET` is undefined in production, `jwt.sign`/`jwt.verify` behavior becomes unsafe/erroring.

**Recommended fix:**
- Add a startup guard that throws if `JWT_SECRET`, `DATABASE_URL`, or `FRONTEND_URL` are missing in production.
- Remove all example secrets from docs; instruct generating a strong random `JWT_SECRET` (e.g. `openssl rand -base64 48`).

---

## 🟠 High Issues

### H-1. Global rate limiter is disabled
**Severity:** High
**Location:** `src/server.js` → `// app.use("/api", globalLimiter);`

Only the login endpoint is rate-limited. All other endpoints (including the 50 MB backup import and member/PII listing) are unthrottled, enabling DoS and scraping.
**Fix:** Re-enable `globalLimiter` for `/api` (and a stricter limiter on `/api/backup/import`).

### H-2. CORS / Socket origin depends on a possibly-undefined `FRONTEND_URL`
**Severity:** High
**Location:** `src/server.js`, `src/socket/index.js`

`cors({ origin: FRONTEND_URL })` and the Socket.IO `cors.origin` use `process.env.FRONTEND_URL`. If unset (it is `sync: false` in `render.yaml` and absent from `.env.example`), `origin` is `undefined`, which disables the origin restriction.
**Fix:** Fail fast if `FRONTEND_URL` is unset in production; support a comma-separated allow-list if multiple origins are needed.

### H-3. JWT stored in `localStorage` (XSS token theft)
**Severity:** High
**Location:** `client/src/context/AuthContext.jsx`, `client/src/lib/api.js`

Tokens in `localStorage` are readable by any injected script. Combined with no Content-Security-Policy, an XSS leads to full account takeover.
**Fix:** Prefer httpOnly, Secure, SameSite cookies for the token; add a CSP via Helmet.

### H-4. Attendance-rate calculation overwrites the member `notes` field (data loss)
**Severity:** High
**Location:** `src/controller/attendance.controller.js` → `saveAttendanceForSession`

After saving attendance, the code writes `data: { notes: 'Attendance Rate: X%' }` to `Member.notes`, **destroying** any real notes an admin entered about that member. The socket extension even has a special-case to suppress broadcasts for this hack, confirming it's a workaround.
**Fix:** Store attendance rate in a dedicated computed field/column (e.g. `attendanceRate Float?`) or compute it on read; never repurpose `notes`.

### H-5. No global Express error handler
**Severity:** High
**Location:** `src/server.js`

Every controller hand-rolls try/catch returning generic 500s. Any unhandled rejection or thrown error outside those blocks crashes the request with no structured response, and raw `err.message` is returned to clients in the backup import path (info disclosure).
**Fix:** Add a centralized error-handling middleware `(err, req, res, next)` and a 404 handler; never echo raw error messages to clients in production.

### H-6. Docker images run development servers, not production builds
**Severity:** High
**Location:** `client/Dockerfile` (`npm run dev`), `server/entrypoint.sh` (`npm run dev` when not production), `docker-compose.yml` (source-mounted, nodemon/vite HMR)

The frontend container serves the Vite dev server; there is no `vite build` + static serve (nginx). The backend uses nodemon with mounted source. These are unsuitable for production (performance, security, stability).
**Fix:** Add a multi-stage frontend Dockerfile (`vite build` → serve `dist/` via nginx) and run the backend with `npm start` only; remove bind mounts from production compose.

### H-7. 50 MB unauthenticated-content import body = DoS / memory pressure
**Severity:** High
**Location:** `src/routes/backup.route.js` (`express.text({ limit: '50mb' })`)

Buffering 50 MB strings into memory and running them in a 120s transaction can exhaust memory and hold DB locks.
**Fix:** Lower the limit, stream/parse incrementally, and add a dedicated strict rate limit + size guard.

### H-8. Login does not enforce HTTPS / secure transport
**Severity:** High
**Location:** deployment config

Credentials and JWTs travel over whatever transport the proxy provides. Render terminates TLS, but there is no `app.set('trust proxy', ...)` or HSTS configuration, and `req.ip` (used for audit logs) will be the proxy IP without `trust proxy`.
**Fix:** Set `app.set('trust proxy', 1)`, enable Helmet HSTS, and ensure cookies (if adopted) are `Secure`.

### H-9. Audit log clear and account delete are irreversible with no safeguards
**Severity:** High
**Location:** `auditLog.controller.js` → `clearAuditLogs`, `account.controller.js` → `deleteAccount`

`clearAuditLogs` wipes the entire audit trail (which itself is a security event that should be immutable). `deleteAccount` lets an admin delete **any** account — including their own or the **last** remaining admin — locking everyone out.
**Fix:** Disallow deleting the audit log (or archive instead); guard against deleting the last active admin and self-deletion of the current admin.

### H-10. No password strength / input validation on account creation & updates
**Severity:** High
**Location:** `account.controller.js`, `portal.controller.js`

Passwords accept any non-empty string; usernames, emails, roles are unvalidated. `role` is taken directly from the request body in `createAccount`, so an admin endpoint can mint arbitrary roles, and there is no check that role values are within an allowed set.
**Fix:** Add a validation layer (Zod/Joi) enforcing min password length/complexity, allowed roles, and email format.

### H-11. bcrypt cost factor is hardcoded low (10) and inconsistent
**Severity:** High (Medium-High)
**Location:** all `bcrypt.hash(..., 10)` call sites

Cost 10 is on the low end for 2026; the value is duplicated across many files.
**Fix:** Centralize into a config constant; use cost 12+.

---

## 🟡 Medium Issues

### M-1. No input validation framework
**Location:** all controllers. Manual `if (!x)` checks are inconsistent and miss type coercion edge cases (`parseInt` of `NaN`, etc.). **Fix:** Adopt Zod/Joi schemas per route.

### M-2. Case-sensitive search in PostgreSQL
**Location:** `member.controller.js` (`searchMembers`), `session.controller.js`, `audition.controller.js`. These use `contains` **without** `mode: 'insensitive'`, while `auditLog.controller.js` correctly uses it. Searches are case-sensitive and inconsistent. **Fix:** Add `mode: 'insensitive'` to all text `contains` filters.

### M-3. Manual cascade deletes instead of schema-level cascades
**Location:** `judge.controller.js`, `audition.controller.js`. Deletions manually walk `evaluationScore` → `judgeEvaluation`. Fragile and non-atomic (not wrapped in a transaction). **Fix:** Declare `onDelete: Cascade` in the schema and/or wrap in `$transaction`.

### M-4. `.env.example` is incomplete
**Location:** `.env.example`. Missing `FRONTEND_URL`, `NODE_ENV`, `VITE_API_URL` (client), and has a stray `[TEMPLATE]` header that would break `.env` parsing if copied verbatim. **Fix:** Provide a complete, valid template for both client and server.

### M-5. README is stale and wrong (says MySQL, wrong ports)
**Location:** `README.md`. Describes "MySQL 8.0", `localhost:3306`, `mysql` service, and port 3002, but the system uses **PostgreSQL 16**, port `5433`/`3302`, and a `postgres` service. Misleads operators. **Fix:** Rewrite to match the actual Postgres setup and `render.yaml` ports.

### M-6. Port inconsistency across configs
**Location:** `server.js` default `3002`, `render.yaml`/Dockerfile `3302`, README `3002`. **Fix:** Standardize on one backend port and reference a single env var.

### M-7. Categories have no validation that percentages sum to 100
**Location:** `category.controller.js`, `audition.controller.js`. Weighted average silently divides by total weight, so percentages that don't sum to 100 produce misleading "averages." **Fix:** Validate the sum (or document the weighting semantics) and surface a warning in the UI.

### M-8. Double socket emits for member creation
**Location:** `member.controller.js` manually `emit('user:created', ...)` while the Prisma extension also emits `member:created`/`user:created`. Risk of duplicate or out-of-order client events. **Fix:** Rely on a single emission source.

### M-9. `req.ip` for audit logs unreliable behind proxy
**Location:** all audit log calls. Without `trust proxy`, logged IPs are the load balancer's. **Fix:** Configure `trust proxy` (see H-8).

### M-10. Backup `escapeValue` date format omits timezone
**Location:** `backup.controller.js`. Dates are serialized as naive `YYYY-MM-DD HH:MM:SS.mmm` (UTC stripped of `Z`). On import into a `timestamp` column the offset is lost; round-tripping across timezones can shift values. **Fix:** Preserve explicit UTC / use `timestamptz` consistently.

### M-11. No pagination on list endpoints
**Location:** `getMembers`, `getSessions`, `getAuditionees`, `getAccounts`. All return full tables with deep `include`s (e.g. accounts loads every member + user; auditionees load all evaluations + scores + categories). Will degrade as data grows. **Fix:** Add pagination + `select` projections.

### M-12. Members can log in but the member portal isn't role-guarded server-side beyond `memberId` presence
**Location:** `portal.route.js` uses only `protect`. An admin (no `memberId`) hitting portal routes gets a 403 by accident, and a member hitting admin routes is blocked by `requireAdmin` — so it works, but the design conflates "has memberId" with "is a member." **Fix:** Add explicit `restrictTo('member')` on portal routes for clarity and safety.

---

## 🟢 Low Issues

- **L-1. Dead code:** `globalLimiter` imported in `server.js` but commented out; `prisma.js` `setPrisma` indirection adds complexity. *(Fix: remove or enable.)*
- **L-2. Excessive `console.log` in Socket.IO** (`index.js`) logs every connect/join/disconnect — noisy and leaks socket IDs in prod. *(Fix: use a leveled logger.)*
- **L-3. Incorrect `reviewedAt` in excuses** (`attendance.controller.js`) uses `session.createdAt` as the review timestamp — semantically wrong. *(Fix: add a real `reviewedAt` column.)*
- **L-4. Magic strings everywhere** for statuses (`'Pending'`, `'Approved'`, `'active'`, `'member'`). *(Fix: centralize as constants/enums.)*
- **L-5. `TestingNoticeModal`** explicitly states the app is "not yet ready for actual deployment" — confirms current intent; remove before go-live.
- **L-6. `getMe` re-fetches full user on every mount** but the `protect` middleware already loaded it — minor redundancy.
- **L-7. Mixed router import styles** (`Router` vs `express.Router()`), inconsistent file naming (`auth.routes.js` vs `*.route.js`).
- **L-8. `formatMember` last-name parsing** is naive (splits on whitespace) and mislabels multi-word surnames. *(Fix: store first/last separately.)*
- **L-9. No health check depth** — `/health` returns static `ok` without checking DB connectivity. *(Fix: ping Prisma in the health check.)*

---

## Dependencies Review

| Package | Notes / Recommendation |
|---------|------------------------|
| `@prisma/client` / `prisma` `^7.8.0` | Very new major; verify the `prisma-client-js` generator + `@prisma/adapter-pg` combo is stable for your Node 22 target. Pin exact versions for reproducible prod builds. |
| `express` `^5.2.1` | Express 5 is a major change from 4; ensure all middleware (error handling, async throw propagation) is v5-compatible. Express 5 auto-forwards async errors — leverage it with a global handler (H-5). |
| `bcrypt` `^6` | Native build dependency — ensure the Docker base image has build tooling (node:22 has it) and consider `bcryptjs` if cross-platform builds cause issues. |
| `jsonwebtoken` `^9` | Fine; ensure `JWT_SECRET` strength (C-7). |
| `helmet` `^8` | Good — but currently used with defaults; add CSP/HSTS (H-3/H-8). |
| `socket.io` `^4.8` | Fine; needs auth (C-3). |
| Client `daisyui` `^5.5.20` (devDep) | Listed as a devDependency but used for styling at build time — acceptable with Tailwind, but verify it's actually referenced in `tailwind.config.js`; if unused, remove. |
| `tailwindcss` `^3.4` | Stable. |
| **Missing:** no test runner / linter | `server` `test` script is a stub (`exit 1`) yet a test file exists (`src/test/backup.roundtrip.test.js`). No ESLint/Prettier config. *Recommendation:* add Vitest/Jest + ESLint and wire `npm test` properly. |
| **Audit:** | Run `npm audit` / `npm outdated` in both packages in CI and fail on high-severity advisories. |

---

## Missing / Incomplete Features

1. **Officer Elections** — `App.jsx` route renders a "Coming soon" placeholder; not implemented.
2. **Password reset / forgot-password flow** — none exists; members rely on the shared `tmc2026` password (C-4).
3. **Email verification** — `auth.controller.js` explicitly notes it's skipped; `User.email` is collected but unused.
4. **First-login forced password change** — absent (C-4).
5. **Real test suite** — only one round-trip test; `npm test` is a stub.
6. **Reports** — confirm the Reports page produces server-backed exports (current API surface suggests client-only aggregation).
7. **Audit log immutability / retention policy** — logs can be bulk-deleted (H-9).
8. **Rate-limit / lockout on repeated failed member logins** beyond the IP-based login limiter.

---

## Production Readiness Checklist (Go / No-Go)

| Item | Status |
|------|--------|
| Arbitrary SQL import removed/secured (C-1) | ❌ |
| `passwordHash` no longer leaked (C-2) | ❌ |
| Socket.IO authenticated (C-3) | ❌ |
| Default/shared passwords eliminated (C-4) | ❌ |
| Member delete is FK-safe & transactional (C-5) | ❌ |
| Role values canonicalized (C-6) | ❌ |
| Secrets enforced via env, none in repo/docs (C-7) | ❌ |
| Global rate limiting enabled (H-1) | ❌ |
| CORS/origins locked to known hosts (H-2) | ⚠️ depends on env |
| Production Docker images (built, not dev servers) (H-6) | ❌ |
| Global error handler + 404 (H-5) | ❌ |
| `trust proxy` + HSTS/CSP (H-3/H-8) | ❌ |
| Accurate README & complete `.env.example` (M-4/M-5) | ❌ |
| Real test + lint pipeline | ❌ |
| DB health check + monitoring | ⚠️ shallow |

---

## Recommended Remediation Order

1. **Block deploy** until all **Critical** items (C-1 … C-7) are fixed — these are exploitable security/data-loss defects.
2. Resolve **High** items (H-1 … H-11), prioritizing rate limiting, the `notes`-overwrite data-loss bug (H-4), production Docker images (H-6), and the global error handler (H-5).
3. Address **Medium** items, focusing on validation (M-1), schema-level cascades (M-3), and documentation/config accuracy (M-4 … M-6).
4. Clean up **Low** items and dead code during hardening.
5. Add CI: `npm audit`, ESLint, and a real test suite before tagging a release.

---

*End of report.*
