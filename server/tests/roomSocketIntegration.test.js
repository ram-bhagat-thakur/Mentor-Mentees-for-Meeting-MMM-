import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { io as createSocketClient } from "socket.io-client";
import "../src/config/env.js";
import { initializeSocketServer } from "../src/socket/index.js";

const previousSecret = process.env.JWT_SECRET;
const testSecret = randomBytes(32).toString("hex");
process.env.JWT_SECRET = testSecret;

function id() {
  return new mongoose.Types.ObjectId().toString();
}

function makeRoom(hostId, menteeId) {
  const activeParticipants = [hostId, menteeId];
  activeParticipants.addToSet = (value) => {
    if (!activeParticipants.includes(value.toString())) activeParticipants.push(value.toString());
  };
  const stageParticipants = [];
  stageParticipants.addToSet = (value) => {
    if (!stageParticipants.includes(value.toString())) stageParticipants.push(value.toString());
  };
  return {
    _id: id(),
    hostId,
    status: "ongoing",
    activeParticipants,
    stageParticipants,
    maxParticipants: 10,
    joinRequests: [],
    async save() {},
  };
}

function makeClient(url, userId) {
  return createSocketClient(url, {
    auth: { token: jwt.sign({ sub: userId }, testSecret, { expiresIn: "1m" }) },
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) reject(timeoutError);
      else resolve(response);
    });
  });
}

function waitFor(socket, event) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 5000);
    socket.once(event, (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });
}

test("two authenticated clients exchange stage request and approval over Socket.IO", async () => {
  const hostId = id();
  const menteeId = id();
  const room = makeRoom(hostId, menteeId);
  const mentee = {
    _id: menteeId,
    name: "Mentee Candidate",
    college: "Example College",
    skills: ["React"],
    role: "mentee",
    isActive: true,
  };
  const httpServer = createServer();
  const socketServer = initializeSocketServer(httpServer, {
    clientUrl: "http://127.0.0.1:5173",
    roomModels: {
      RoomModel: { findById: async (roomId) => (roomId === room._id ? room : null) },
      UserModel: {
        findById(userId) {
          return { select: async () => (userId.toString() === menteeId ? mentee : null) };
        },
      },
    },
  });
  let hostClient;
  let menteeClient;

  try {
    httpServer.listen(0, "127.0.0.1");
    await once(httpServer, "listening");
    const url = `http://127.0.0.1:${httpServer.address().port}`;
    hostClient = makeClient(url, hostId);
    menteeClient = makeClient(url, menteeId);

    const hostConnected = waitFor(hostClient, "connection:ready");
    const menteeConnected = waitFor(menteeClient, "connection:ready");
    hostClient.connect();
    menteeClient.connect();
    await Promise.all([hostConnected, menteeConnected]);

    const hostRoom = await emitWithAck(hostClient, "room:join", { roomId: room._id });
    const menteeRoom = await emitWithAck(menteeClient, "room:join", { roomId: room._id });
    assert.deepEqual(hostRoom.requests, []);
    assert.equal(menteeRoom.stageStatus, "idle");

    const queueUpdate = waitFor(hostClient, "room:queue_updated");
    const requestResult = await emitWithAck(menteeClient, "room:request_stage", { roomId: room._id });
    const queuePayload = await queueUpdate;
    assert.equal(requestResult.status, "pending");
    assert.equal(queuePayload.requests[0].name, mentee.name);

    const approvedNotification = waitFor(menteeClient, "room:stage_approved");
    const approvalResult = await emitWithAck(hostClient, "room:approve_stage", {
      roomId: room._id,
      targetUserId: menteeId,
    });
    assert.equal(approvalResult.status, "approved");
    assert.deepEqual(await approvedNotification, { roomId: room._id });
    assert.ok(room.stageParticipants.includes(menteeId));
  } finally {
    hostClient?.disconnect();
    menteeClient?.disconnect();
    await new Promise((resolve) => socketServer.close(resolve));
    if (httpServer.listening) await new Promise((resolve) => httpServer.close(resolve));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});