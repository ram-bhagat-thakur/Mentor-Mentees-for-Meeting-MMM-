import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getDatabaseStatus } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok", database: getDatabaseStatus() });
});

app.use("/api/auth", authRoutes);
app.use("/api/mentors", authMiddleware, mentorRoutes);
app.use("/api/rooms", authMiddleware, roomRoutes);

app.use((_request, _response, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

app.use(errorHandler);

export default app;