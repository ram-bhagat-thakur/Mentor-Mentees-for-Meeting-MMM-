import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import Room from "../models/Room.js";
import { broadcastFeedStatus, serializeFeedRoom } from "../socket/events/feedEvents.js";
import { createAgoraRtcToken } from "../services/agoraService.js";
import { listLiveRooms } from "../services/roomService.js";

const createRoomSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().default(""),
  topics: z.array(z.string().trim().min(1).max(80)).max(12).optional().default([]),
  maxParticipants: z.coerce.number().int().min(1).max(100).optional().default(25),
}).strict();

export const agoraTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) =>
    response.status(429).json({ error: "Too many RTC token requests. Please try again later." }),
});

function invalidRoomId(response) {
  return response.status(404).json({ error: "Room not found." });
}

async function findRoom(roomId, response) {
  if (!mongoose.isValidObjectId(roomId)) {
    invalidRoomId(response);
    return null;
  }

  const room = await Room.findById(roomId);
  if (!room) invalidRoomId(response);
  return room;
}

function emitRoomEvent(request, action, room) {
  const io = request.app.get("io");
  if (io) broadcastFeedStatus(io, action, room);
}

export async function getLiveRooms(_request, response, next) {
  try {
    const rooms = await listLiveRooms();
    return response.status(200).json({ rooms });
  } catch (error) {
    return next(error);
  }
}

export async function createRoom(request, response, next) {
  if (request.user.role !== "mentor") {
    return response.status(403).json({ error: "Only mentors can create rooms." });
  }

  const parsed = createRoomSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid room details." });
  }

  try {
    const room = new Room({
      ...parsed.data,
      hostId: request.user._id,
      status: "ongoing",
      activeParticipants: [request.user._id],
    });
    await room.save();
    await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
    emitRoomEvent(request, "created", room);
    return response.status(201).json({ room: serializeFeedRoom(room) });
  } catch (error) {
    return next(error);
  }
}

export async function joinRoom(request, response, next) {
  try {
    const room = await findRoom(request.params.roomId, response);
    if (!room) return undefined;
    if (room.status !== "ongoing") {
      return response.status(409).json({ error: "This room is not currently live." });
    }

    const alreadyJoined = room.activeParticipants.some((participantId) =>
      participantId.equals(request.user._id),
    );
    if (!alreadyJoined && room.activeParticipants.length >= room.maxParticipants) {
      return response.status(409).json({ error: "This room has reached its participant limit." });
    }

    if (!alreadyJoined) {
      room.activeParticipants.addToSet(request.user._id);
      await room.save();
      await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
      emitRoomEvent(request, "updated", room);
    }

    return response.status(200).json({ room: serializeFeedRoom(room) });
  } catch (error) {
    return next(error);
  }
}

export async function leaveRoom(request, response, next) {
  try {
    const room = await findRoom(request.params.roomId, response);
    if (!room) return undefined;

    const wasParticipant = room.activeParticipants.some((participantId) =>
      participantId.equals(request.user._id),
    );
    if (wasParticipant) {
      room.activeParticipants.pull(request.user._id);
      room.stageParticipants.pull(request.user._id);
      await room.save();
      await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
      emitRoomEvent(request, "updated", room);
    } else {
      await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
    }

    return response.status(200).json({ room: serializeFeedRoom(room) });
  } catch (error) {
    return next(error);
  }
}

export async function endRoom(request, response, next) {
  try {
    const room = await findRoom(request.params.roomId, response);
    if (!room) return undefined;
    if (!room.hostId.equals(request.user._id)) {
      return response.status(403).json({ error: "Only the room host can end this room." });
    }

    if (room.status !== "ended") {
      room.status = "ended";
      room.activeParticipants = [];
      room.stageParticipants = [];
      await room.save();
      await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
      emitRoomEvent(request, "ended", room);
    } else {
      await room.populate({ path: "hostId", select: "name college mentorProfile.company" });
    }

    return response.status(200).json({ room: serializeFeedRoom(room) });
  } catch (error) {
    return next(error);
  }
}

export async function getAgoraToken(request, response, next) {
  try {
    const room = await findRoom(request.params.roomId, response);
    if (!room) return undefined;

    const isHost = room.hostId.toString() === request.user._id.toString();
    const isActiveParticipant = room.activeParticipants.some((participantId) =>
      participantId.equals(request.user._id),
    );

    if (!isHost && !isActiveParticipant) {
      return response.status(403).json({
        error: "User is not an authorized participant in this room",
      });
    }

    if (room.status !== "ongoing") {
      return response.status(409).json({ error: "Agora tokens are only available for live rooms." });
    }

    const token = createAgoraRtcToken({ room, user: request.user });
    response.set("Cache-Control", "no-store");
    return response.status(200).json(token);
  } catch (error) {
    return next(error);
  }
}