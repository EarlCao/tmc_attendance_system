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
import { globalLimiter } from "./middleware/rateLimit.middleware.js";

const BACKEND_PORT = process.env.BACKEND_PORT || 3002;
const FRONTEND_URL = process.env.FRONTEND_URL;
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO on the same HTTP server
const io = initSocket(httpServer, FRONTEND_URL);
// Wrap prisma with socket-aware extension so all mutations auto-broadcast
setPrisma(createSocketAwarePrisma(prisma));

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
// app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/officers", officerRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/auditions", auditionRoutes);
app.use("/api/rules", ruleRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

process.on('SIGTERM', async () => await prisma.$disconnect());

httpServer.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});