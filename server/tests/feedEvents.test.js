import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import mongoose from "mongoose";
import { io as createSocketClient } from "socket.io-client";
import "../src/config/env.js";
import app from "../src/app.js";
import Room from "../src/models/Room.js";
import User from "../src/models/User.js";
import { initializeSocketServer } from "../src/socket/index.js";
import { signAccessToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

function expectFeedEvent(socket, action) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${action} feed event.`)), 5000);
    socket.once("feed:status_change", (payload) => {
      clearTimeout(timeout);
      if (payload.action !== action) {
        reject(new Error(`Expected ${action}, received ${payload.action}.`));
        return;
      }
      resolve(payload);
    });
  });
}

function connectClient(url, token) {
  const socket = createSocketClient(url, {
    auth: { token },
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
  });

  const connected = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Socket connection timed out.")), 5000);
    socket.once("connection:ready", () => {
      clearTimeout(timeout);
      resolve();
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  socket.connect();
  return { socket, connected };
}

test(
  "room creation, participant changes, and ending broadcast safe feed updates to all sockets",
  { skip: !process.env.MONGODB_URI },
  async () => {
    const suffix = randomUUID();
    const emails = [`mmm-feed-host-${suffix}@example.edu`, `mmm-feed-guest-${suffix}@example.edu`];
    const previousSecret = process.env.JWT_SECRET;
    const previousIo = app.get("io");
    process.env.JWT_SECRET = randomBytes(32).toString("hex");

    let roomId;
    let hostSocket;
    let guestSocket;
    let io;
    const httpServer = createServer(app);

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const [host, guest] = await User.create([
        {
          name: "Feed Event Host",
          email: emails[0],
          password: "Feed-Event-Password-123",
          role: "mentor",
          college: "Example University",
        },
        {
          name: "Feed Event Guest",
          email: emails[1],
          password: "Feed-Event-Password-123",
          role: "mentee",
          college: "Example University",
        },
      ]);

      io = initializeSocketServer(httpServer, { clientUrl: "http://127.0.0.1:5173" });
      app.set("io", io);
      httpServer.listen(0, "127.0.0.1");
      await once(httpServer, "listening");
      const baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
      const hostClient = connectClient(baseUrl, signAccessToken(host));
      const guestClient = connectClient(baseUrl, signAccessToken(guest));
      hostSocket = hostClient.socket;
      guestSocket = guestClient.socket;
      await Promise.all([hostClient.connected, guestClient.connected]);

      const hostCreatedEvent = expectFeedEvent(hostSocket, "created");
      const guestCreatedEvent = expectFeedEvent(guestSocket, "created");
      const createResponse = await fetch(`${baseUrl}/api/rooms`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${signAccessToken(host)}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: `Realtime Room ${suffix}`,
          topics: ["Career Advice"],
        }),
      });
      const createdRoom = await createResponse.json();
      roomId = createdRoom.room._id;
      assert.equal(createResponse.status, 201);

      const [hostCreated, guestCreated] = await Promise.all([hostCreatedEvent, guestCreatedEvent]);
      assert.deepEqual(hostCreated, guestCreated);
      assert.equal(hostCreated.room._id, roomId);
      assert.equal(hostCreated.room.participantCount, 1);
      assert.equal("activeParticipants" in hostCreated.room, false);
      assert.equal("password" in hostCreated.room.hostId, false);

      const hostJoinEvent = expectFeedEvent(hostSocket, "updated");
      const guestJoinEvent = expectFeedEvent(guestSocket, "updated");
      const joinResponse = await fetch(`${baseUrl}/api/rooms/${roomId}/participants`, {
        method: "POST",
        headers: { authorization: `Bearer ${signAccessToken(guest)}` },
      });
      assert.equal(joinResponse.status, 200);
      const [hostJoined, guestJoined] = await Promise.all([hostJoinEvent, guestJoinEvent]);
      assert.deepEqual(hostJoined, guestJoined);
      assert.equal(hostJoined.room.participantCount, 2);

      const hostLeaveEvent = expectFeedEvent(hostSocket, "updated");
      const guestLeaveEvent = expectFeedEvent(guestSocket, "updated");
      const leaveResponse = await fetch(`${baseUrl}/api/rooms/${roomId}/participants/me`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${signAccessToken(guest)}` },
      });
      assert.equal(leaveResponse.status, 200);
      const [hostLeft, guestLeft] = await Promise.all([hostLeaveEvent, guestLeaveEvent]);
      assert.deepEqual(hostLeft, guestLeft);
      assert.equal(hostLeft.room.participantCount, 1);

      const hostEndedEvent = expectFeedEvent(hostSocket, "ended");
      const guestEndedEvent = expectFeedEvent(guestSocket, "ended");
      const endResponse = await fetch(`${baseUrl}/api/rooms/${roomId}/end`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${signAccessToken(host)}` },
      });
      assert.equal(endResponse.status, 200);
      const [hostEnded, guestEnded] = await Promise.all([hostEndedEvent, guestEndedEvent]);
      assert.deepEqual(hostEnded, guestEnded);
      assert.equal(hostEnded.room.status, "ended");
      assert.equal(hostEnded.room.participantCount, 0);
    } finally {
      hostSocket?.disconnect();
      guestSocket?.disconnect();

      try {
        if (mongoose.connection.readyState === 1) {
          if (roomId) await Room.deleteOne({ _id: roomId });
          await User.deleteMany({ email: { $in: emails } });
        }
      } finally {
        try {
          if (io) {
            await new Promise((resolve) => {
              const timeout = setTimeout(resolve, 2000);
              io.close(() => {
                clearTimeout(timeout);
                resolve();
              });
              httpServer.closeAllConnections();
            });
          } else if (httpServer.listening) {
            await new Promise((resolve) => {
              httpServer.close(resolve);
              httpServer.closeAllConnections();
            });
          }
          await mongoose.disconnect();
        } finally {
          app.set("io", previousIo);
          if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
          } else {
            process.env.JWT_SECRET = previousSecret;
          }
        }
      }
    }
  },
);
