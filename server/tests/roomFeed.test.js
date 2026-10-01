import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";
import mongoose from "mongoose";
import "../src/config/env.js";
import app from "../src/app.js";
import Room from "../src/models/Room.js";
import User from "../src/models/User.js";
import { signAccessToken } from "../src/utils/jwt.js";

process.env.JWT_SECRET = randomBytes(32).toString("hex");

test(
  "live room feed is authenticated and returns ongoing rooms with safe host details and counts",
  { skip: !process.env.MONGODB_URI },
  async () => {
    const suffix = randomUUID();
    const emails = [`mmm-room-host-${suffix}@example.edu`, `mmm-room-guest-${suffix}@example.edu`];
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    const createdRoomIds = [];
    let server;

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const [host, guest] = await User.create([
        {
          name: "Feed Host",
          email: emails[0],
          password: "Room-Feed-Test-Password-123",
          role: "mentor",
          college: "Example University",
        },
        {
          name: "Feed Guest",
          email: emails[1],
          password: "Room-Feed-Test-Password-123",
          role: "mentee",
          college: "Example University",
        },
      ]);

      const [liveRoom, scheduledRoom] = await Room.create([
        {
          hostId: host._id,
          title: `Portfolio Review ${suffix}`,
          description: "Live mentor room",
          status: "ongoing",
          topics: ["Portfolio", "Careers"],
          activeParticipants: [host._id, guest._id],
        },
        {
          hostId: host._id,
          title: `Scheduled Room ${suffix}`,
          status: "scheduled",
        },
      ]);
      createdRoomIds.push(liveRoom._id, scheduledRoom._id);

      server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      const endpoint = `http://127.0.0.1:${server.address().port}/api/rooms`;

      const unauthorized = await fetch(endpoint);
      assert.equal(unauthorized.status, 401);

      const response = await fetch(endpoint, {
        headers: { authorization: `Bearer ${signAccessToken(guest)}` },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.rooms.length, 1);
      assert.equal(body.rooms[0]._id, liveRoom._id.toString());
      assert.equal(body.rooms[0].participantCount, 2);
      assert.deepEqual(body.rooms[0].topics, ["Portfolio", "Careers"]);
      assert.equal(body.rooms[0].hostId.name, "Feed Host");
      assert.equal("password" in body.rooms[0].hostId, false);
      assert.equal("activeParticipants" in body.rooms[0], false);
    } finally {
      try {
        if (mongoose.connection.readyState === 1) {
          await Room.deleteMany({ _id: { $in: createdRoomIds } });
          await User.deleteMany({ email: { $in: emails } });
        }
      } finally {
        try {
          if (server) await new Promise((resolve) => server.close(resolve));
          await mongoose.disconnect();
        } finally {
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