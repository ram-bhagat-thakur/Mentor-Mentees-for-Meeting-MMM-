import { Router } from "express";
import {
	createRoom,
	endRoom,
	agoraTokenLimiter,
	getLiveRooms,
	getAgoraToken,
	joinRoom,
	leaveRoom,
} from "../controllers/roomController.js";

const router = Router();

router.get("/", getLiveRooms);
router.get("/:roomId/agora-token", agoraTokenLimiter, getAgoraToken);
router.post("/", createRoom);
router.post("/:roomId/participants", joinRoom);
router.delete("/:roomId/participants/me", leaveRoom);
router.patch("/:roomId/end", endRoom);

export default router;