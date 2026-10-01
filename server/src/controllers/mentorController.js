import { z } from "zod";
import { findMentors } from "../services/mentorService.js";

const searchValue = z.string().trim().max(120).optional();
const skillsValue = z.union([
  z.string().trim().max(1000),
  z.array(z.string().trim().min(1).max(80)).max(20),
]).optional();

const mentorQuerySchema = z.object({
  search: searchValue,
  skills: skillsValue,
  college: z.string().trim().max(160).optional(),
  almaMater: z.string().trim().max(160).optional(),
  company: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function getMentors(request, response, next) {
  const parsed = mentorQuerySchema.safeParse(request.query);

  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid mentor search parameters." });
  }

  try {
    const result = await findMentors(parsed.data, request.user);
    return response.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}