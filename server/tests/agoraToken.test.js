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
  "Agora token route authorizes room roles, rejects outsiders, and returns a bounded token",
  { skip: !process.env.MONGODB_URI },
  async () => {
    const suffix = randomUUID();
    const emails = [
      `mmm-agora-host-${suffix}@example.edu`,
      `mmm-agora-subscriber-${suffix}@example.edu`,
      `mmm-agora-speaker-${suffix}@example.edu`,
      `mmm-agora-outsider-${suffix}@example.edu`,
    ];
    const previousSecret = process.env.JWT_SECRET;
    const previousAppId = process.env.AGORA_APP_ID;
    const previousCertificate = process.env.AGORA_APP_CERTIFICATE;
    process.env.JWT_SECRET = randomBytes(32).toString("hex");
    process.env.AGORA_APP_ID = "0123456789abcdef0123456789abcdef";
    process.env.AGORA_APP_CERTIFICATE = "abcdef0123456789abcdef0123456789";

    let roomId;
    let server;

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      const [host, subscriber, speaker, outsider] = await User.create([
        {
          name: "Agora Token Host",
          email: emails[0],
          password: "Agora-Token-Test-Password-123",
          role: "mentor",
          college: "Example University",
        },
        {
          name: "Agora Subscriber",
          email: emails[1],
          password: "Agora-Token-Test-Password-123",
          role: "mentee",
          college: "Example University",
        },
        {
          name: "Agora Stage Speaker",
          email: emails[2],
          password: "Agora-Token-Test-Password-123",
          role: "mentee",
          college: "Example University",
        },
        {
          name: "Agora Outsider",
          email: emails[3],
          password: "Agora-Token-Test-Password-123",
          role: "mentee",
          college: "Example University",
        },
      ]);

      const room = await Room.create({
        hostId: host._id,
        title: `Agora Token Room ${suffix}`,
        status: "ongoing",
        activeParticipants: [host._id, subscriber._id, speaker._id],
        stageParticipants: [speaker._id],
      });
      roomId = room._id;

      server = app.listen(0, "127.0.0.1");
      await once(server, "listening");
      const endpoint = `http://127.0.0.1:${server.address().port}/api/rooms/${roomId}/agora-token`;
      const now = Math.floor(Date.now() / 1000);

      async function requestToken(user) {
        return fetch(endpoint, {
          headers: { authorization: `Bearer ${signAccessToken(user)}` },
        });
      }

      const hostResponse = await requestToken(host);
      const hostBody = await hostResponse.json();
      assert.equal(hostResponse.status, 200);
      assert.equal(hostBody.role, "PUBLISHER");
      assert.equal(hostBody.channelName, roomId.toString());
      assert.equal(hostBody.uid, host._id.toString());
      assert.equal(typeof hostBody.rtcToken, "string");
      assert.ok(hostBody.privilegeExpireTime >= now + 3599);
      assert.ok(hostBody.privilegeExpireTime <= now + 3601);
      assert.equal(JSON.stringify(hostBody).includes(process.env.AGORA_APP_CERTIFICATE), false);
      assert.equal(hostResponse.headers.get("cache-control"), "no-store");

      const subscriberResponse = await requestToken(subscriber);
      const subscriberBody = await subscriberResponse.json();
      assert.equal(subscriberResponse.status, 200);
      assert.equal(subscriberBody.role, "SUBSCRIBER");

      const speakerResponse = await requestToken(speaker);
      const speakerBody = await speakerResponse.json();
      assert.equal(speakerResponse.status, 200);
      assert.equal(speakerBody.role, "PUBLISHER");

      const outsiderResponse = await requestToken(outsider);
      assert.equal(outsiderResponse.status, 403);
      assert.deepEqual(await outsiderResponse.json(), {
        error: "User is not an authorized participant in this room",
      });

      const unauthenticatedResponse = await fetch(endpoint);
      assert.equal(unauthenticatedResponse.status, 401);

      const missingRoomResponse = await fetch(
        `http://127.0.0.1:${server.address().port}/api/rooms/${new mongoose.Types.ObjectId()}/agora-token`,
        { headers: { authorization: `Bearer ${signAccessToken(host)}` } },
      );
      assert.equal(missingRoomResponse.status, 404);
      assert.deepEqual(await missingRoomResponse.json(), { error: "Room not found." });
    } finally {
      try {
        if (mongoose.connection.readyState === 1) {
          if (roomId) await Room.deleteOne({ _id: roomId });
          await User.deleteMany({ email: { $in: emails } });
        }
      } finally {
        try {
          if (server) await new Promise((resolve) => server.close(resolve));
          await mongoose.disconnect();
        } finally {
          process.env.JWT_SECRET = previousSecret;
          if (previousAppId === undefined) delete process.env.AGORA_APP_ID;
          else process.env.AGORA_APP_ID = previousAppId;
          if (previousCertificate === undefined) delete process.env.AGORA_APP_CERTIFICATE;
          else process.env.AGORA_APP_CERTIFICATE = previousCertificate;
        }
      }
    }
  },
);

test("Agora token generation fails clearly when credentials are missing", async () => {
  const { createAgoraRtcToken } = await import("../src/services/agoraService.js");
  const previousAppId = process.env.AGORA_APP_ID;
  const previousCertificate = process.env.AGORA_APP_CERTIFICATE;
  delete process.env.AGORA_APP_ID;
  delete process.env.AGORA_APP_CERTIFICATE;

  try {
    assert.throws(
      () => createAgoraRtcToken({ room: {}, user: {} }),
      /Agora RTC token service is not configured\. Missing: AGORA_APP_ID, AGORA_APP_CERTIFICATE\./,
    );
  } finally {
    if (previousAppId === undefined) delete process.env.AGORA_APP_ID;
    else process.env.AGORA_APP_ID = previousAppId;
    if (previousCertificate === undefined) delete process.env.AGORA_APP_CERTIFICATE;
    else process.env.AGORA_APP_CERTIFICATE = previousCertificate;
  }
});