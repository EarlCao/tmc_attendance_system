import "dotenv/config";
import { prisma } from "./lib/prisma.js";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";

const BACKEND_PORT = process.env.BACKEND_PORT;
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

process.on('SIGTERM', async () => await prisma.$disconnect());

httpServer.listen(BACKEND_PORT, () => {
  console.log(`Server is running on port ${BACKEND_PORT}`);
});