import { Router } from "express";
import {
	createRoom,
	endRoom,
	getLiveRooms,
	joinRoom,
	leaveRoom,
} from "../controllers/roomController.js";

const router = Router();

router.get("/", getLiveRooms);
router.post("/", createRoom);
router.post("/:roomId/participants", joinRoom);
router.delete("/:roomId/participants/me", leaveRoom);
router.patch("/:roomId/end", endRoom);

export default router;