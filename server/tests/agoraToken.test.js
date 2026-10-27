import { afterAll, beforeEach, expect, jest, test } from "@jest/globals";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";

const originalEnvironment = {
  agoraAppId: process.env.AGORA_APP_ID,
  agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE,
  jwtSecret: process.env.JWT_SECRET,
};
const testEnvironment = {
  agoraAppId: "0123456789abcdef0123456789abcdef",
  agoraAppCertificate: "abcdef0123456789abcdef0123456789",
  jwtSecret: randomBytes(32).toString("hex"),
};
const mockFindRoomById = jest.fn();
const mockFindUserById = jest.fn();

await jest.unstable_mockModule("../src/models/Room.js", () => ({
  default: { findById: mockFindRoomById },
}));
await jest.unstable_mockModule("../src/models/User.js", () => ({
  default: { findById: mockFindUserById },
}));

const { default: app } = await import("../src/app.js");
const { createAgoraRtcToken, RTC_TOKEN_TTL_SECONDS } = await import("../src/services/agoraService.js");
const { signAccessToken } = await import("../src/utils/jwt.js");

const host = { _id: new mongoose.Types.ObjectId(), role: "mentor" };
const subscriber = { _id: new mongoose.Types.ObjectId(), role: "mentee" };
const stageParticipant = { _id: new mongoose.Types.ObjectId(), role: "mentee" };
const outsider = { _id: new mongoose.Types.ObjectId(), role: "mentee" };
const usersById = new Map(
  [host, subscriber, stageParticipant, outsider].map((user) => [
    user._id.toString(),
    user,
  ]),
);
const roomId = new mongoose.Types.ObjectId();
const room = {
  _id: roomId,
  hostId: host._id,
  status: "ongoing",
  activeParticipants: [host._id, subscriber._id, stageParticipant._id],
  stageParticipants: [stageParticipant._id],
};

function requestAgoraToken(user) {
  return request(app)
    .get(`/api/rooms/${roomId}/agora-token`)
    .set("Authorization", `Bearer ${signAccessToken(user)}`);
}

beforeEach(() => {
  process.env.AGORA_APP_ID = testEnvironment.agoraAppId;
  process.env.AGORA_APP_CERTIFICATE = testEnvironment.agoraAppCertificate;
  process.env.JWT_SECRET = testEnvironment.jwtSecret;
  mockFindRoomById.mockReset().mockImplementation(async (id) =>
    id === roomId.toString() ? room : null);
  mockFindUserById.mockReset().mockImplementation(async (id) =>
    usersById.get(id.toString()) || null);
});

afterAll(() => {
  for (const [key, value] of [
    ["AGORA_APP_ID", originalEnvironment.agoraAppId],
    ["AGORA_APP_CERTIFICATE", originalEnvironment.agoraAppCertificate],
    ["JWT_SECRET", originalEnvironment.jwtSecret],
  ]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("generates Agora tokens with host, stage participant, and audience roles", () => {
  const now = 1_700_000_000_000;
  const hostToken = createAgoraRtcToken({ room, user: host, now });
  const stageToken = createAgoraRtcToken({ room, user: stageParticipant, now });
  const audienceToken = createAgoraRtcToken({ room, user: subscriber, now });

  expect(hostToken.role).toBe("PUBLISHER");
  expect(stageToken.role).toBe("PUBLISHER");
  expect(audienceToken.role).toBe("SUBSCRIBER");
  expect(hostToken.channelName).toBe(roomId.toString());
  expect(hostToken.uid).toBe(host._id.toString());
  expect(hostToken.privilegeExpireTime).toBe(
    Math.floor(now / 1000) + RTC_TOKEN_TTL_SECONDS,
  );
  expect(hostToken.rtcToken).toEqual(expect.any(String));
});

test("returns publisher and subscriber tokens only to authorized room users", async () => {
  const [hostResponse, subscriberResponse, stageResponse] = await Promise.all([
    requestAgoraToken(host),
    requestAgoraToken(subscriber),
    requestAgoraToken(stageParticipant),
  ]);

  expect(hostResponse.status).toBe(200);
  expect(hostResponse.body.role).toBe("PUBLISHER");
  expect(hostResponse.headers["cache-control"]).toContain("no-store");
  expect(hostResponse.text).not.toContain(testEnvironment.agoraAppCertificate);

  expect(subscriberResponse.status).toBe(200);
  expect(subscriberResponse.body.role).toBe("SUBSCRIBER");
  expect(stageResponse.status).toBe(200);
  expect(stageResponse.body.role).toBe("PUBLISHER");
});

test("rejects unauthenticated and non-participant Agora token requests", async () => {
  const [unauthenticatedResponse, outsiderResponse] = await Promise.all([
    request(app).get(`/api/rooms/${roomId}/agora-token`),
    requestAgoraToken(outsider),
  ]);

  expect(unauthenticatedResponse.status).toBe(401);
  expect(outsiderResponse.status).toBe(403);
  expect(outsiderResponse.body).toEqual({
    error: "User is not an authorized participant in this room",
  });
});

test("returns not found for missing rooms and reports missing Agora credentials", async () => {
  mockFindRoomById.mockResolvedValue(null);
  const missingRoomResponse = await requestAgoraToken(host);
  expect(missingRoomResponse.status).toBe(404);
  expect(missingRoomResponse.body).toEqual({ error: "Room not found." });

  delete process.env.AGORA_APP_ID;
  delete process.env.AGORA_APP_CERTIFICATE;
  expect(() => createAgoraRtcToken({ room, user: host })).toThrow(
    "Agora RTC token service is not configured. Missing: AGORA_APP_ID, AGORA_APP_CERTIFICATE.",
  );
});
