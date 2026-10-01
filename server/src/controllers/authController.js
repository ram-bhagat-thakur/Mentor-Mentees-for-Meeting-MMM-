import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import { isInstitutionalEmail } from "../utils/emailValidator.js";
import { signAccessToken } from "../utils/jwt.js";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must be no more than 72 bytes when encoded.",
  });

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
    role: z.enum(["mentee", "mentor"]),
    college: z.string().trim().min(1).max(160),
    skills: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    bio: z.array(z.string().trim().max(500)).max(10).optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
  })
  .strict();

export function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    college: user.college,
    skills: user.skills,
    bio: user.bio,
    mentorProfile: user.mentorProfile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function sendValidationError(response, error) {
  return response.status(400).json({ error: error.issues[0]?.message || "Invalid request." });
}

export async function register(request, response, next) {
  const parsed = registerSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(response, parsed.error);
  }

  if (!isInstitutionalEmail(parsed.data.email)) {
    return response.status(400).json({
      error: "Use an approved institutional email address (.edu, .ac.in, or an approved campus domain).",
    });
  }

  try {
    const user = new User(parsed.data);
    const token = signAccessToken(user);
    await user.save();

    return response.status(201).json({
      user: serializeUser(user),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ error: "An account with this email already exists." });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      const firstError = Object.values(error.errors)[0];
      return response.status(400).json({ error: firstError?.message || "Invalid user details." });
    }

    return next(error);
  }
}

export async function login(request, response, next) {
  const parsed = loginSchema.safeParse(request.body);

  if (!parsed.success) {
    return sendValidationError(response, parsed.error);
  }

  try {
    const user = await User.findOne({ email: parsed.data.email }).select("+password");
    const validPassword = user && (await bcrypt.compare(parsed.data.password, user.password));

    if (!validPassword) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    return response.status(200).json({
      user: serializeUser(user),
      token: signAccessToken(user),
    });
  } catch (error) {
    return next(error);
  }
}

export function currentUser(request, response) {
  return response.status(200).json({ user: serializeUser(request.user) });
}