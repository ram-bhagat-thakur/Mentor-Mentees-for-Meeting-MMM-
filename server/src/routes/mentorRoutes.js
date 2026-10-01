import { Router } from "express";
import { getMentors } from "../controllers/mentorController.js";

const router = Router();

router.get("/", getMentors);

export default router;