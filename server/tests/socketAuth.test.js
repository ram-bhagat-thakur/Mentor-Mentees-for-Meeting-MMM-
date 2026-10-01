import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import { io as createSocketClient } from "socket.io-client";
import "../src/config/env.js";
import app from "../src/app.js";
import { initializeSocketServer } from "../src/socket/index.js";

const previousSecret = process.env.JWT_SECRET;
const testSecret = randomBytes(32).toString("hex");
process.env.JWT_SECRET = testSecret;

function connectClient(url, options = {}) {
  const client = createSocketClient(url, {
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    transports: ["websocket"],
    ...options,
  });

  return client;
}

test("socket handshake requires valid auth token or Bearer authorization header", async () => {
  const httpServer = createServer(app);
  const socketServer = initializeSocketServer(httpServer, {
    clientUrl: "http://127.0.0.1:5173",
  });

  try {
    httpServer.listen(0, "127.0.0.1");
    await once(httpServer, "listening");
    const url = `http://127.0.0.1:${httpServer.address().port}`;

    const missingTokenClient = connectClient(url);
    const missingTokenError = new Promise((resolve) =>
      missingTokenClient.once("connect_error", resolve),
    );
    missingTokenClient.connect();
    assert.equal(
      (await missingTokenError).message,
      "Authentication error: Invalid or expired token",
    );
    missingTokenClient.disconnect();

    const invalidTokenClient = connectClient(url, { auth: { token: "not-a-jwt" } });
    const invalidTokenError = new Promise((resolve) =>
      invalidTokenClient.once("connect_error", resolve),
    );
    invalidTokenClient.connect();
    assert.equal(
      (await invalidTokenError).message,
      "Authentication error: Invalid or expired token",
    );
    invalidTokenClient.disconnect();

    const expiredToken = jwt.sign({ sub: "user-expired" }, testSecret, { expiresIn: -1 });
    const expiredTokenClient = connectClient(url, { auth: { token: expiredToken } });
    const expiredTokenError = new Promise((resolve) =>
      expiredTokenClient.once("connect_error", resolve),
    );
    expiredTokenClient.connect();
    assert.equal(
      (await expiredTokenError).message,
      "Authentication error: Invalid or expired token",
    );
    expiredTokenClient.disconnect();

    const token = jwt.sign({ sub: "user-authenticated" }, testSecret, { expiresIn: "1m" });
    const authClient = connectClient(url, { auth: { token } });
    const readyPayload = new Promise((resolve, reject) => {
      authClient.once("connection:ready", resolve);
      authClient.once("connect_error", reject);
    });
    authClient.connect();
    assert.deepEqual(await readyPayload, { userId: "user-authenticated" });
    authClient.disconnect();

    const headerClient = connectClient(url, {
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    const headerReadyPayload = new Promise((resolve, reject) => {
      headerClient.once("connection:ready", resolve);
      headerClient.once("connect_error", reject);
    });
    headerClient.connect();
    assert.deepEqual(await headerReadyPayload, { userId: "user-authenticated" });
    headerClient.disconnect();
  } finally {
    await new Promise((resolve) => socketServer.close(resolve));
    if (httpServer.listening) {
      await new Promise((resolve) => httpServer.close(resolve));
    }

    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});