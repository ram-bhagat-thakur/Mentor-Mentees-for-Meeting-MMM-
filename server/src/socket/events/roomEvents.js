import mongoose from "mongoose";
import { z } from "zod";
import Room from "../../models/Room.js";
import User from "../../models/User.js";

const roomIdSchema = z.string().refine(mongoose.isValidObjectId, "Invalid room ID.");
const joinRoomSchema = z.object({ roomId: roomIdSchema }).strict();
const stageRequestSchema = z.object({
  roomId: roomIdSchema,
  userId: z.string().optional(),
}).strict();
const stageActionSchema = z.object({
  roomId: roomIdSchema,
  targetUserId: z.string().refine(mongoose.isValidObjectId, "Invalid participant ID."),
}).strict();

const userRoom = (userId) => `user:${userId}`;
const roomSocketRoom = (roomId) => `room:${roomId}`;

function acknowledge(callback, result) {
  if (typeof callback === "function") callback(result);
}

function publicRequest(user, requestedAt) {
  return {
    userId: user._id.toString(),
    name: user.name,
    college: user.college,
    skills: user.skills || [],
    requestedAt,
  };
}

async function getQueue(room, UserModel) {
  const users = await Promise.all(room.joinRequests.map(async (request) => {
    const user = await UserModel.findById(request.userId).select("name college skills");
    return user ? publicRequest(user, request.requestedAt) : null;
  }));
  return users.filter(Boolean);
}

function emitQueue(io, hostId, roomId, requests) {
  io.to(userRoom(hostId)).emit("room:queue_updated", { roomId, requests });
}

export function registerRoomEvents(io, socket, { RoomModel = Room, UserModel = User } = {}) {
  const userId = socket.user.sub;
  socket.join(userRoom(userId));

  socket.on("room:join", async (payload, callback) => {
    const parsed = joinRoomSchema.safeParse(payload);
    if (!parsed.success) return acknowledge(callback, { error: "Invalid room request." });

    try {
      const { roomId } = parsed.data;
      const room = await RoomModel.findById(roomId);
      if (!room || room.status !== "ongoing") {
        return acknowledge(callback, { error: "This room is not currently live." });
      }
      const isHost = room.hostId.toString() === userId;
      const isParticipant = room.activeParticipants.some((id) => id.toString() === userId);
      if (!isHost && !isParticipant) {
        return acknowledge(callback, { error: "You are not a participant in this room." });
      }

      socket.join(roomSocketRoom(roomId));
      const response = { roomId };
      if (isHost) response.requests = await getQueue(room, UserModel);
      else response.stageStatus = room.stageParticipants.some((id) => id.toString() === userId)
        ? "approved"
        : room.joinRequests.some((request) => request.userId.toString() === userId)
          ? "pending"
          : "idle";
      return acknowledge(callback, response);
    } catch {
      return acknowledge(callback, { error: "Could not join room signaling." });
    }
  });

  socket.on("room:request_stage", async (payload, callback) => {
    const parsed = stageRequestSchema.safeParse(payload);
    if (!parsed.success || (parsed.data.userId && parsed.data.userId !== userId)) {
      return acknowledge(callback, { error: "Invalid stage request." });
    }

    try {
      const { roomId } = parsed.data;
      const [room, user] = await Promise.all([
        RoomModel.findById(roomId),
        UserModel.findById(userId).select("name college skills role isActive"),
      ]);
      if (!room || room.status !== "ongoing") {
        return acknowledge(callback, { error: "This room is not currently live." });
      }
      if (!user?.isActive || user.role !== "mentee" || room.hostId.toString() === userId) {
        return acknowledge(callback, { error: "Only active mentees can request the stage." });
      }
      if (!room.activeParticipants.some((id) => id.toString() === userId)) {
        return acknowledge(callback, { error: "Join the room before requesting the stage." });
      }
      if (room.stageParticipants.some((id) => id.toString() === userId)) {
        return acknowledge(callback, { status: "approved" });
      }

      let request = room.joinRequests.find((entry) => entry.userId.toString() === userId);
      if (!request) {
        room.joinRequests.push({ userId });
        await room.save();
        request = room.joinRequests.find((entry) => entry.userId.toString() === userId);
      }

      const requests = await getQueue(room, UserModel);
      emitQueue(io, room.hostId.toString(), roomId, requests);
      return acknowledge(callback, { status: "pending", request: publicRequest(user, request.requestedAt) });
    } catch {
      return acknowledge(callback, { error: "Could not submit the stage request." });
    }
  });

  async function handleStageDecision(payload, callback, decision) {
    const parsed = stageActionSchema.safeParse(payload);
    if (!parsed.success) return acknowledge(callback, { error: "Invalid stage decision." });

    try {
      const { roomId, targetUserId } = parsed.data;
      const room = await RoomModel.findById(roomId);
      if (!room || room.status !== "ongoing") {
        return acknowledge(callback, { error: "This room is not currently live." });
      }
      if (room.hostId.toString() !== userId) {
        return acknowledge(callback, { error: "Only the room host can manage stage requests." });
      }
      const requestIndex = room.joinRequests.findIndex(
        (request) => request.userId.toString() === targetUserId,
      );
      if (requestIndex < 0) {
        return acknowledge(callback, { error: "This stage request is no longer pending." });
      }

      if (decision === "approve") {
        const isParticipant = room.activeParticipants.some((id) => id.toString() === targetUserId);
        if (!isParticipant && room.activeParticipants.length >= room.maxParticipants) {
          return acknowledge(callback, { error: "The room has reached its participant limit." });
        }
        room.activeParticipants.addToSet(targetUserId);
        room.stageParticipants.addToSet(targetUserId);
      }
      room.joinRequests.splice(requestIndex, 1);
      await room.save();

      const requests = await getQueue(room, UserModel);
      emitQueue(io, userId, roomId, requests);
      io.to(userRoom(targetUserId)).emit(
        decision === "approve" ? "room:stage_approved" : "room:stage_rejected",
        { roomId },
      );
      return acknowledge(callback, { status: decision === "approve" ? "approved" : "rejected" });
    } catch {
      return acknowledge(callback, { error: "Could not update the stage request." });
    }
  }

  socket.on("room:approve_stage", (payload, callback) => {
    void handleStageDecision(payload, callback, "approve");
  });
  socket.on("room:reject_stage", (payload, callback) => {
    void handleStageDecision(payload, callback, "reject");
  });
}