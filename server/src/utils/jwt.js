import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || /your_jwt_super_secret|change_in_production/i.test(secret)) {
    throw new Error("JWT_SECRET is not configured with a production value.");
  }

  if (process.env.NODE_ENV === "production" && Buffer.byteLength(secret) < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes in production.");
  }

  return secret;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}