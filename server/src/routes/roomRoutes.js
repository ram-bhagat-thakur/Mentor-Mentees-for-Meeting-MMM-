import { Router } from "express";
import { getLiveRooms } from "../controllers/roomController.js";

const router = Router();

router.get("/", getLiveRooms);

export default router;