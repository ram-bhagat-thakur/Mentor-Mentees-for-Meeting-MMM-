import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

function unauthorized(response) {
  return response.status(401).json({ error: "Unauthorized" });
}

export default async function authMiddleware(request, response, next) {
  const authorization = request.get("authorization") || "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);

  if (!match) {
    return unauthorized(response);
  }

  let payload;

  try {
    payload = verifyAccessToken(match[1]);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return unauthorized(response);
    }

    return next(error);
  }

  if (
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !mongoose.isValidObjectId(payload.sub)
  ) {
    return unauthorized(response);
  }

  try {
    const user = await User.findById(payload.sub);

    if (!user) {
      return unauthorized(response);
    }

    request.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}