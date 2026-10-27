import { afterAll, beforeEach, expect, jest, test } from "@jest/globals";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { randomBytes } from "node:crypto";

const originalJwtSecret = process.env.JWT_SECRET;
const jwtSecret = randomBytes(32).toString("hex");
const mockFindById = jest.fn();

await jest.unstable_mockModule("../src/models/User.js", () => ({
  default: { findById: mockFindById },
}));

const { default: authMiddleware } = await import("../src/middleware/authMiddleware.js");

const user = {
  _id: new mongoose.Types.ObjectId(),
  name: "Authentication Test User",
};
const app = express();
app.get("/protected", authMiddleware, (req, res) => {
  res.status(200).json({ userId: req.user._id.toString() });
});

function tokenFor(secret = jwtSecret, options = {}) {
  return jwt.sign({ sub: user._id.toString() }, secret, options);
}

beforeEach(() => {
  process.env.JWT_SECRET = jwtSecret;
  mockFindById.mockReset().mockResolvedValue(user);
});

afterAll(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test("accepts a valid JWT, loads the user, and attaches it to the request", async () => {
  const response = await request(app)
    .get("/protected")
    .set("Authorization", `Bearer ${tokenFor()}`);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({ userId: user._id.toString() });
  expect(mockFindById).toHaveBeenCalledWith(user._id.toString());
});

test("rejects missing and malformed authorization headers with 401", async () => {
  const responses = await Promise.all([
    request(app).get("/protected"),
    request(app).get("/protected").set("Authorization", "Bearer"),
    request(app).get("/protected").set("Authorization", "Basic token"),
    request(app).get("/protected").set("Authorization", "Bearer token extra"),
  ]);

  expect(responses.map(({ status }) => status)).toEqual([401, 401, 401, 401]);
  expect(mockFindById).not.toHaveBeenCalled();
});

test("rejects expired JWTs and invalid signatures with 401", async () => {
  const expiredToken = tokenFor(jwtSecret, { expiresIn: -1 });
  const invalidSignature = tokenFor(randomBytes(32).toString("hex"));
  const responses = await Promise.all([
    request(app).get("/protected").set("Authorization", `Bearer ${expiredToken}`),
    request(app).get("/protected").set("Authorization", `Bearer ${invalidSignature}`),
  ]);

  expect(responses.map(({ status }) => status)).toEqual([401, 401]);
  expect(mockFindById).not.toHaveBeenCalled();
});

test("rejects valid tokens that do not resolve to an active user record", async () => {
  mockFindById.mockResolvedValueOnce(null);

  const response = await request(app)
    .get("/protected")
    .set("Authorization", `Bearer ${tokenFor()}`);

  expect(response.status).toBe(401);
});
