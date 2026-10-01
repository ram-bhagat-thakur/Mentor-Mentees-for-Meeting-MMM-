import { Router } from "express";
import rateLimit from "express-rate-limit";
import authMiddleware from "../middleware/authMiddleware.js";
import { currentUser, login, register } from "../controllers/authController.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) =>
    response.status(429).json({ error: "Too many authentication attempts. Please try again later." }),
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", authMiddleware, currentUser);

export default router;