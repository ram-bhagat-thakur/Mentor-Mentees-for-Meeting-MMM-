import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import { registerRoomEvents } from "../src/socket/events/roomEvents.js";

function id() {
  return new mongoose.Types.ObjectId().toString();
}

function objectIdArray(values = []) {
  const entries = [...values];
  entries.addToSet = (value) => {
    const normalized = value.toString();
    if (!entries.some((entry) => entry.toString() === normalized)) entries.push(value);
  };
  return entries;
}

function makeRoom({ roomId = id(), hostId = id(), menteeId = id(), requests = [] } = {}) {
  return {
    _id: roomId,
    hostId,
    status: "ongoing",
    maxParticipants: 8,
    activeParticipants: objectIdArray([hostId, menteeId]),
    stageParticipants: objectIdArray(),
    joinRequests: [...requests],
    async save() {},
  };
}

function makeSocket(userId) {
  const handlers = new Map();
  const joinedRooms = [];
  return {
    user: { sub: userId },
    handlers,
    joinedRooms,
    join(roomName) {
      joinedRooms.push(roomName);
    },
    on(event, handler) {
      handlers.set(event, handler);
    },
  };
}

function makeModels(room, users) {
  return {
    RoomModel: { findById: async (roomId) => (roomId === room._id ? room : null) },
    UserModel: {
      findById(userId) {
        return { select: async () => users.get(userId.toString()) || null };
      },
    },
  };
}

function makeIo() {
  const events = [];
  return {
    events,
    to(roomName) {
      return { emit: (event, payload) => events.push({ roomName, event, payload }) };
    },
  };
}

function send(socket, event, payload) {
  return new Promise((resolve) => socket.handlers.get(event)(payload, resolve));
}

test("mentee stage requests persist once and update only the host queue", async () => {
  const hostId = id();
  const menteeId = id();
  const room = makeRoom({ hostId, menteeId });
  const user = {
    _id: menteeId,
    name: "Mentee Example",
    college: "Example College",
    skills: ["React", "Node.js"],
    role: "mentee",
    isActive: true,
  };
  const io = makeIo();
  const socket = makeSocket(menteeId);
  registerRoomEvents(io, socket, { ...makeModels(room, new Map([[menteeId, user]])) });

  const firstResponse = await send(socket, "room:request_stage", { roomId: room._id });
  const secondResponse = await send(socket, "room:request_stage", { roomId: room._id });

  assert.equal(firstResponse.status, "pending");
  assert.equal(secondResponse.status, "pending");
  assert.equal(room.joinRequests.length, 1);
  assert.deepEqual(io.events.at(-1), {
    roomName: `user:${hostId}`,
    event: "room:queue_updated",
    payload: {
      roomId: room._id,
      requests: [{
        userId: menteeId,
        name: user.name,
        college: user.college,
        skills: user.skills,
        requestedAt: room.joinRequests[0].requestedAt,
      }],
    },
  });
});

test("only the room host can approve, and approval promotes the mentee", async () => {
  const hostId = id();
  const menteeId = id();
  const request = { userId: menteeId, requestedAt: new Date() };
  const room = makeRoom({ hostId, menteeId, requests: [request] });
  const io = makeIo();
  const models = makeModels(room, new Map());
  const outsiderSocket = makeSocket(id());
  registerRoomEvents(io, outsiderSocket, models);

  const denied = await send(outsiderSocket, "room:approve_stage", {
    roomId: room._id,
    targetUserId: menteeId,
  });
  assert.match(denied.error, /Only the room host/);
  assert.equal(room.stageParticipants.length, 0);
  assert.equal(room.joinRequests.length, 1);

  const hostSocket = makeSocket(hostId);
  registerRoomEvents(io, hostSocket, models);
  const approved = await send(hostSocket, "room:approve_stage", {
    roomId: room._id,
    targetUserId: menteeId,
  });

  assert.deepEqual(approved, { status: "approved" });
  assert.equal(room.stageParticipants.some((value) => value.toString() === menteeId), true);
  assert.equal(room.joinRequests.length, 0);
  assert.equal(io.events.at(-1).roomName, `user:${menteeId}`);
  assert.equal(io.events.at(-1).event, "room:stage_approved");
});

test("host rejection removes the queue entry and notifies the mentee", async () => {
  const hostId = id();
  const menteeId = id();
  const room = makeRoom({ hostId, menteeId, requests: [{ userId: menteeId }] });
  const io = makeIo();
  const socket = makeSocket(hostId);
  registerRoomEvents(io, socket, makeModels(room, new Map()));

  const result = await send(socket, "room:reject_stage", {
    roomId: room._id,
    targetUserId: menteeId,
  });

  assert.deepEqual(result, { status: "rejected" });
  assert.equal(room.joinRequests.length, 0);
  assert.equal(io.events.at(-1).roomName, `user:${menteeId}`);
  assert.equal(io.events.at(-1).event, "room:stage_rejected");
});