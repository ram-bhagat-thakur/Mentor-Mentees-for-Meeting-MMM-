import { verifyAccessToken } from "../../utils/jwt.js";

const authenticationError = () => new Error("Authentication error: Invalid or expired token");

function extractToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.trim();
  }

  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization !== "string") {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return match?.[1] || null;
}

export default function authSocketMiddleware(socket, next) {
  const token = extractToken(socket);
  if (!token) {
    return next(authenticationError());
  }

  try {
    const decoded = verifyAccessToken(token);
    if (!decoded || typeof decoded !== "object" || typeof decoded.sub !== "string") {
      return next(authenticationError());
    }

    socket.user = Object.freeze({ ...decoded });
    return next();
  } catch {
    return next(authenticationError());
  }
}