import assert from "node:assert/strict";
import { after, test } from "node:test";
import { getAllowedClientOrigins } from "../src/config/env.js";

const originalNodeEnv = process.env.NODE_ENV;

after(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

test("development CORS allows localhost and 127.0.0.1 client origins", () => {
  process.env.NODE_ENV = "development";

  assert.deepEqual(getAllowedClientOrigins("http://127.0.0.1:5173"), [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
});

test("production CORS allows only the configured client origin", () => {
  process.env.NODE_ENV = "production";

  assert.deepEqual(getAllowedClientOrigins("https://mentor-bridge-seven.vercel.app"), [
    "https://mentor-bridge-seven.vercel.app",
  ]);
});

test("production CORS supports an explicit allowlist of Vercel origins", () => {
  process.env.NODE_ENV = "production";

  assert.deepEqual(getAllowedClientOrigins(
    "https://mentor-bridge-seven.vercel.app, https://mentor-bridge-git-main-mmm-e94f.vercel.app/",
  ), [
    "https://mentor-bridge-seven.vercel.app",
    "https://mentor-bridge-git-main-mmm-e94f.vercel.app",
  ]);
});
