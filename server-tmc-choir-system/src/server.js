import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import { initSocket, createSocketAwarePrisma } from "./socket/index.js";
import { prisma, setPrisma } from "./lib/prisma.js";

import authRoutes from "./routes/auth.routes.js";
import semesterRoutes from "./routes/semester.route.js";
import memberRoutes from "./routes/member.route.js";
import sessionRoutes from "./routes/session.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import officerRoutes from "./routes/officer.route.js";
import judgeRoutes from "./routes/judge.route.js";
import auditionRoutes from "./routes/audition.route.js";
import ruleRoutes from "./routes/rule.route.js";
import categoryRoutes from "./routes/category.route.js";
import backupRoutes from "./routes/backup.route.js";
import accountRoutes from "./routes/account.route.js";
import portalRoutes from "./routes/portal.route.js";
import auditLogRoutes from "./routes/auditLog.route.js";
import reportRoutes from "./routes/report.route.js";
import { globalLimiter, backupLimiter } from "./middleware/rateLimit.middleware.js";

// Fail fast if required configuration is missing — prevents deploying with an
// undefined JWT_SECRET (auth bypass risk) or undefined FRONTEND_URL (CORS open).
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL', 'JWT_EXPIRES_IN'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is too weak for production (minimum 32 characters).');
  process.exit(1);
}

const BACKEND_PORT = process.env.BACKEND_PORT || 3302;
// FRONTEND_URL may contain a comma-separated allow-list of origins (e.g. a
// Vercel preview + production URL). Build an array so CORS and Socket.IO only
// accept known origins.
const ALLOWED_ORIGINS = process.env.FRONTEND_URL.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const app = express();
const httpServer = createServer(app);

// Trust the reverse proxy (Render/Vercel terminate TLS) so req.ip reflects the
// real client address — required for accurate audit logs and per-IP rate
// limiting. Only enabled in production to avoid trusting spoofed headers locally.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Initialize Socket.IO on the same HTTP server
const io = initSocket(httpServer, ALLOWED_ORIGINS);
// Wrap prisma with socket-aware extension so all mutations auto-broadcast
setPrisma(createSocketAwarePrisma(prisma));

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
// Helmet hardening: enable HSTS and a Content-Security-Policy to reduce XSS
// impact (the JWT lives in localStorage, so limiting script sources matters).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", ...ALLOWED_ORIGINS, 'ws:', 'wss:'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(express.json());
// Global rate limiter protects every API route from abuse / scraping / DoS.
app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/officers", officerRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/auditions", auditionRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);

app.get("/health", async (req, res) => {
  // Deep health check: verify DB connectivity so the endpoint reflects whether
  // the service can actually serve requests, not just that the process is up.
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", db: "up" });
  } catch (err) {
    console.error("Health check DB error:", err);
    res.status(503).json({ status: "error", db: "down" });
  }
});

// 404 handler for unknown routes.
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized error handler. Express 5 forwards async errors here automatically.
// Never leak raw error details to clients in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    status: status >= 500 ? 'error' : 'fail',
    message: isProd && status >= 500 ? 'Internal server error' : (err.message || 'Internal server error'),
  });
});

process.on('SIGTERM', async () => await prisma.$disconnect());

httpServer.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});
