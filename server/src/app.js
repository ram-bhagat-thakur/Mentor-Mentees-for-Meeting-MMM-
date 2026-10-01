import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getDatabaseStatus } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://127.0.0.1:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok", database: getDatabaseStatus() });
});

app.use("/api/auth", authRoutes);
app.use("/api/mentors", authMiddleware, mentorRoutes);

app.use((_request, _response, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

app.use(errorHandler);

export default app;