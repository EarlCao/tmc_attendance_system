import "dotenv/config";
import { prisma } from "./lib/prisma.js";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import semesterRoutes from "./routes/semester.route.js";
import memberRoutes from "./routes/member.route.js";

const BACKEND_PORT = process.env.BACKEND_PORT || 3002;
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/members", memberRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

process.on('SIGTERM', async () => await prisma.$disconnect());

httpServer.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});