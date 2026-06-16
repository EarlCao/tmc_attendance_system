# TMC Choir Attendance System

A web-based attendance and audition management system for the TMC Choir. Built with React + Vite (frontend) and Express + Prisma + MySQL (backend).

---

## Prerequisites

Make sure the following are installed on your machine:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (comes bundled with Docker Desktop)

---

## Running the Project

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd tmc-choir-attendance-system
```

### 2. Start all services

```bash
docker compose up --build
```

This single command will:

- Start a **MySQL 8.0** database
- Run all **Prisma migrations** automatically
- Start the **Express backend** on `http://localhost:3002`
- Start the **React/Vite frontend** on `http://localhost:5173`

> On first run, use `--build` to build the images. Subsequent runs can skip it:
> ```bash
> docker compose up
> ```

### 3. Open the app

Visit **http://localhost:5173** in your browser.

---

## Stopping the Project

```bash
docker compose down
```

To also delete the database volume (full reset):

```bash
docker compose down -v
```

---

## Project Structure

```
tmc-choir-attendance-system/
├── docker-compose.yml               # Runs all 3 services together
├── client-tmc-choir-system/         # React + Vite frontend
│   ├── Dockerfile.dev               # Frontend Docker image
│   └── src/
├── server-tmc-choir-system/         # Express + Prisma backend
│   ├── Dockerfile.dev               # Backend Docker image
│   ├── entrypoint.sh                # Runs migrations then starts server
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── src/
```

---

## Services & Ports

| Service  | URL                        | Description            |
|----------|----------------------------|------------------------|
| Frontend | http://localhost:5173      | React/Vite dev server  |
| Backend  | http://localhost:3002      | Express REST API       |
| MySQL    | localhost:3306             | Database               |

---

## Useful Commands

### View running containers
```bash
docker compose ps
```

### View logs
```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

### Seed the database
```bash
docker compose exec backend node prisma/seed.js
```

### Run a Prisma migration (after editing schema.prisma)
```bash
docker compose exec backend npx prisma migrate dev --name <migration-name>
```

### Open a MySQL shell
```bash
docker compose exec mysql mysql -u root -ppasscode tmc_choir_system_db
```

### Rebuild a specific service
```bash
docker compose up --build backend
```

---

## Environment Variables

Variables are set directly in `docker-compose.yml`. Key ones:

| Variable         | Default                              | Description                |
|------------------|--------------------------------------|----------------------------|
| `DATABASE_URL`   | postgresql://<user>:<pass>@postgres:5432/<db> | Prisma database connection |
| `JWT_SECRET`     | _(required, no default)_             | JWT signing key            |
| `JWT_EXPIRES_IN` | 7d                                   | JWT lifetime               |
| `BACKEND_PORT`   | 3002                                 | Express server port        |
| `FRONTEND_URL`   | http://localhost:5173                | CORS / Socket.IO origin    |
| `SEED_ADMIN_PASSWORD` | _(required to seed)_            | Initial admin password     |

> **Never commit real secrets.** Generate a strong `JWT_SECRET` before deploying:
> ```bash
> openssl rand -base64 48
> ```
> The server refuses to start in production if `JWT_SECRET`, `DATABASE_URL`, `FRONTEND_URL`, or `JWT_EXPIRES_IN` are missing.

---

## Hot Reload

Both services support hot reload out of the box when running via Docker:

- **Frontend** — Vite HMR reloads the browser on every file save.
- **Backend** — Nodemon restarts the server on every file save.

Changes to files in `client-tmc-choir-system/src/` and `server-tmc-choir-system/src/` take effect immediately without restarting Docker.
