# 🎵 TMC Choir Attendance System

A web-based **attendance** and **audition management** system for the TMC Choir.

- **Frontend:** React 18 + Vite + Tailwind CSS / DaisyUI
- **Backend:** Express 5 + Prisma 7 + Socket.IO
- **Database:** PostgreSQL 16
- **Auth:** JWT-based, with `ADMIN` and `MEMBER` roles
- **Realtime:** Socket.IO for live attendance/audition updates

---

## Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Docker)](#quick-start-docker)
4. [Environment Variables](#environment-variables)
5. [Seeding the Database](#seeding-the-database)
6. [Logging In](#logging-in)
7. [Running Locally Without Docker](#running-locally-without-docker)
8. [NPM Scripts](#npm-scripts)
9. [Common Commands](#common-commands)
10. [Project Structure](#project-structure)
11. [Services & Ports](#services--ports)
12. [Troubleshooting](#troubleshooting)
13. [Production Deployment](#production-deployment)

---

## Features

- 👥 **Member management** — track members, statuses (Active / Inactive / Alumni / Graduated), and auto-generated login accounts
- 🗓️ **Attendance** — record per-session attendance, excuses, and attendance rates
- 🎤 **Auditions** — manage auditionees, judges, evaluation categories, and scores
- 📊 **Reports & dashboards** — for both admins and members
- 🔐 **Role-based access** — admin and member portals
- 🛟 **Backup & restore** — export/import the database via the admin panel
- 🧾 **Audit logs** — security and activity tracking

---

## Prerequisites

Make sure the following are installed on your machine:

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (bundled with Docker Desktop)

> Running **without** Docker also requires Node.js 22+ and a local PostgreSQL 16 instance — see [Running Locally Without Docker](#running-locally-without-docker).

---

## Quick Start (Docker)

This is the recommended way to run the project. Everything (database, backend, frontend) starts with one command.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd tmc_attendance_system
```

### 2. Create your `.env` file

The Docker setup reads configuration from a `.env` file in the **project root**. Copy the example and fill in the values:

```bash
cp .env.example .env
```

Then edit `.env` and set **at minimum**:

```env
# --- Database ---
DATABASE_ROOT_USER=admin
DATABASE_ROOT_PASS=passcode
DATABASE_NAME=tmc_choir_system_db

# --- Ports ---
FRONTEND_PORT=5173
BACKEND_PORT=3002

# --- Auth ---
JWT_SECRET=<run: openssl rand -base64 48>
JWT_EXPIRES_IN=7d

# --- App ---
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Needed only to seed the initial admin (see "Seeding the Database")
SEED_ADMIN_PASSWORD=admin123
```

> ⚠️ **Generate a real `JWT_SECRET`** — never commit it:
> ```bash
> openssl rand -base64 48
> ```
> The backend **refuses to start** if `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, or `JWT_EXPIRES_IN` are missing. In `production` mode, `JWT_SECRET` must also be **at least 32 characters**.

### 3. Start all services

```bash
docker compose up --build
```

This single command will:

- 🐘 Start a **PostgreSQL 16** database (with a healthcheck)
- 🔄 Run **`prisma generate`** + **`prisma migrate deploy`** automatically (via `entrypoint.sh`)
- 🚀 Start the **Express backend** on `http://localhost:<BACKEND_PORT>` (default `3002`)
- 💻 Start the **React/Vite frontend** on `http://localhost:<FRONTEND_PORT>` (default `5173`)

> On first run, use `--build` to build the images. Subsequent runs can skip it:
> ```bash
> docker compose up
> ```
> Add `-d` to run in the background (detached).

### 4. Seed an admin account

In a **separate terminal** (while the containers are running):

```bash
docker exec -it -e SEED_ADMIN_PASSWORD=admin123 tmc-choir-backend npm run db:seed
```

This wipes the DB and creates a single `admin` account. (See [Seeding the Database](#seeding-the-database) for the full demo dataset.)

### 5. Open the app

Visit **http://localhost:5173** and log in with `admin` / `admin123`.

---

## Environment Variables

All variables live in the **project-root `.env`** (consumed by `docker-compose.yml`). The frontend gets its API target injected via Docker as `VITE_API_TARGET`.

| Variable               | Example / Default                         | Description                                            |
|------------------------|-------------------------------------------|--------------------------------------------------------|
| `DATABASE_ROOT_USER`   | `admin`                                   | PostgreSQL username                                    |
| `DATABASE_ROOT_PASS`   | `passcode`                                | PostgreSQL password                                    |
| `DATABASE_NAME`        | `tmc_choir_system_db`                     | PostgreSQL database name                               |
| `DATABASE_URL`         | _(auto-built in compose)_                 | Prisma connection string                               |
| `FRONTEND_PORT`        | `5173`                                     | Port for the Vite dev server                           |
| `BACKEND_PORT`         | `3002`                                     | Port for the Express API                               |
| `JWT_SECRET`           | _(required, no default)_                  | JWT signing key — generate with `openssl rand -base64 48` |
| `JWT_EXPIRES_IN`       | `7d`                                      | JWT lifetime                                           |
| `NODE_ENV`             | `development`                             | `development` or `production`                          |
| `FRONTEND_URL`         | `http://localhost:5173`                   | CORS / Socket.IO allowed origin                        |
| `SEED_ADMIN_PASSWORD`  | _(required to seed)_                      | Password for the seeded `admin` account                |

> 💡 In Docker, `DATABASE_URL` is assembled automatically from the `DATABASE_*` vars and points to the `postgres` service. PostgreSQL is exposed on the host at **port `5433`** (mapped from the container's `5432`).

---

## Seeding the Database

Two seed scripts are provided. **Both wipe all existing data first** (including audit logs).

### Admin-only seed

Creates just the `admin` account — a clean slate.

```bash
docker exec -it -e SEED_ADMIN_PASSWORD=admin123 tmc-choir-backend npm run db:seed
```

- **Login:** `admin` / `<SEED_ADMIN_PASSWORD>`

### Full demo seed

Populates a large realistic dataset: **5 semesters**, evaluation categories, 40 members (each with a login), officers, judges, ~8 sessions per semester with attendance, ~10 auditionees per semester with evaluations and scores, and rules.

```bash
docker exec -it -e SEED_ADMIN_PASSWORD=admin123 tmc-choir-backend npm run db:seed:demo
```

- **Admin login:** `admin` / `<SEED_ADMIN_PASSWORD>`
- **Demo member login example:** `maria.santos` / `tmcchoir2026`
  - All demo members share the password `tmcchoir2026`; usernames follow `firstname.lastname`.

> Running locally without Docker? Use the same commands without the `docker exec` prefix, e.g.:
> ```bash
> cd server-tmc-choir-system
> SEED_ADMIN_PASSWORD=admin123 npm run db:seed:demo
> ```

---

## Logging In

| Role   | Username (example)     | Password         | Notes                                   |
|--------|------------------------|------------------|-----------------------------------------|
| Admin  | `admin`                | `SEED_ADMIN_PASSWORD` | Full access to all admin features  |
| Member | `firstname.lastname`   | `tmcchoir2026`   | Only after running the **demo** seed    |

New member accounts created by an admin in-app receive a **unique one-time temporary password** shown in the UI at creation time.

---

## Running Locally Without Docker

Prefer running natively? You'll need **Node.js 22+** and a running **PostgreSQL 16** instance.

### 1. Backend

```bash
cd server-tmc-choir-system
npm install

# Create a .env in this folder (or export the vars) with at least:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/tmc_choir_system_db
#   JWT_SECRET=<32+ char secret>
#   JWT_EXPIRES_IN=7d
#   FRONTEND_URL=http://localhost:5173
#   NODE_ENV=development
#   SEED_ADMIN_PASSWORD=admin123

npx prisma generate
npx prisma migrate deploy      # apply migrations
npm run db:seed                # create the admin (or db:seed:demo for demo data)
npm run dev                    # starts on BACKEND_PORT (default 3002)
```

### 2. Frontend

```bash
cd client-tmc-choir-system
npm install

# Create a .env with the backend URL:
#   VITE_API_URL=http://localhost:3002

npm run dev                    # starts on http://localhost:5173
```

---

## NPM Scripts

These are the scripts defined in each `package.json`. Run them from inside the respective folder (or via `docker exec -it <container> npm run <script>`).

### Backend (`server-tmc-choir-system/package.json`)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Start the API with auto-reload (development) |
| `npm start` | `node src/server.js` | Start the API (production) |
| `npm run migrate:dev` | `prisma migrate dev` | Create + apply a new migration (development) |
| `npm run migrate:prod` | `dotenv -e ../.env.production -- prisma migrate deploy` | Apply pending migrations against the production DB (uses root `.env.production`) |
| `npm run db:seed` | `node prisma/seed.js` | **Admin-only** seed — wipes the DB, creates just the `admin` account |
| `npm run db:seed:demo` | `node prisma/seed-demo.js` | **Full demo** seed — wipes the DB, generates 5 semesters of realistic data |
| `npm run backfill:local` | `node prisma/backfill-accounts.js` | Create login accounts for any members missing one (local DB) |
| `npm run backfill:prod` | `node prisma/backfill-accounts.js --prod` | Same backfill against the production DB |

> `db:seed` and `db:seed:demo` require the `SEED_ADMIN_PASSWORD` environment variable.

### Frontend (`client-tmc-choir-system/package.json`)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start the Vite dev server (default `http://localhost:5173`) |
| `npm run build` | `vite build` | Build the production bundle into `dist/` |
| `npm run preview` | `vite preview` | Preview the production build locally |

---

## Common Commands

### View running containers
```bash
docker compose ps
```

### View logs
```bash
docker compose logs -f            # all services
docker compose logs -f backend    # backend only
docker compose logs -f frontend   # frontend only
```

### Open a shell in the backend container
```bash
docker exec -it tmc-choir-backend sh
```

### Open a PostgreSQL shell
```bash
docker exec -it tmc-choir-postgres psql -U admin -d tmc_choir_system_db
```

### Create a new Prisma migration (after editing `schema.prisma`)
```bash
docker exec -it tmc-choir-backend npx prisma migrate dev --name <migration-name>
```

### Apply pending migrations
```bash
docker exec -it tmc-choir-backend npx prisma migrate deploy
```

### Rebuild a single service
```bash
docker compose up --build backend
```

### Stop everything
```bash
docker compose down
```

### Stop and wipe the database volume (full reset)
```bash
docker compose down -v
```

---

## Project Structure

```
tmc_attendance_system/
├── docker-compose.yml               # Runs Postgres + backend + frontend together
├── .env.example                     # Template for the root .env
├── render.yaml                      # Backend deploy config (Render)
│
├── client-tmc-choir-system/         # React + Vite frontend
│   ├── Dockerfile
│   ├── vite.config.js               # Dev proxy uses VITE_API_TARGET
│   ├── vercel.json
│   └── src/
│       ├── pages/                   # Admin + member pages
│       ├── components/
│       ├── context/                 # Auth / Socket / Semester contexts
│       ├── hooks/
│       └── layouts/
│
└── server-tmc-choir-system/         # Express + Prisma backend
    ├── Dockerfile
    ├── entrypoint.sh                # generate + migrate, then start server
    ├── API_DOCUMENTATION.md
    ├── prisma/
    │   ├── schema.prisma
    │   ├── seed.js                  # admin-only seed
    │   ├── seed-demo.js             # full demo seed (5 semesters)
    │   └── migrations/
    └── src/
        ├── server.js
        ├── routes/
        ├── controller/
        ├── middleware/
        ├── socket/
        └── lib/
```

---

## Services & Ports

| Service   | Container name        | Host URL / Port            | Description                |
|-----------|-----------------------|----------------------------|----------------------------|
| Frontend  | `tmc-choir-frontend`  | http://localhost:5173      | React / Vite dev server    |
| Backend   | `tmc-choir-backend`   | http://localhost:3002      | Express REST API + Socket.IO |
| Database  | `tmc-choir-postgres`  | localhost:**5433**         | PostgreSQL 16              |

> Ports come from `FRONTEND_PORT` / `BACKEND_PORT` in `.env`. PostgreSQL is exposed on host port **5433** to avoid clashing with a local Postgres on `5432`.

---

## Troubleshooting

**Backend exits immediately on startup**
Check that `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, and `JWT_EXPIRES_IN` are all set in your `.env`. In `production`, `JWT_SECRET` must be ≥ 32 characters.

**`invalid input value for enum ...` during seeding**
The database schema is out of date. Apply migrations:
```bash
docker exec -it tmc-choir-backend npx prisma migrate deploy
```

**Frontend can't reach the API / CORS errors**
Ensure `FRONTEND_URL` matches the URL you're visiting, and that the frontend's `VITE_API_TARGET` (Docker) or `VITE_API_URL` (local) points to the backend.

**Port already in use**
Change `FRONTEND_PORT` / `BACKEND_PORT` in `.env`, or stop the conflicting process.

**Start over with a clean database**
```bash
docker compose down -v
docker compose up --build
docker exec -it -e SEED_ADMIN_PASSWORD=admin123 tmc-choir-backend npm run db:seed
```

---

## Production Deployment

The project is set up to deploy the **backend on Render** and the **frontend on Vercel**.

### Backend (Render)

`render.yaml` defines the service. Set these in the Render dashboard (marked `sync: false`):

- `DATABASE_URL` — your production Postgres connection string
- `JWT_SECRET` — a strong **≥ 32-char** secret (`openssl rand -base64 48`)
- `FRONTEND_URL` — your deployed Vercel frontend URL

Build/start are handled automatically:
```
buildCommand:  npm ci && npx prisma generate
startCommand:  npx prisma migrate deploy && npm start
```

### Frontend (Vercel)

Set in the Vercel project settings:

- `VITE_API_URL` — your deployed Render backend URL

> The gitignored `.env.production` file is **only** used by local `npm run migrate:prod` / `npm run backfill:prod` scripts — it is **not** deployed. Production secrets must be set in the Render/Vercel dashboards.

---

## License

ISC
