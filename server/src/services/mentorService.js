import User from "../models/User.js";

const mentorProjection = {
  _id: 1,
  name: 1,
  role: 1,
  college: 1,
  skills: 1,
  bio: 1,
  createdAt: 1,
  "mentorProfile.company": 1,
  "mentorProfile.jobTitle": 1,
  "mentorProfile.domain": 1,
  "mentorProfile.pricing": 1,
  "mentorProfile.rating": 1,
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSkills(value) {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(entries.flatMap((entry) => entry.split(",")).map((skill) => skill.trim()).filter(Boolean))];
}

function almaMaterFilter(value, requesterCollege) {
  if (!value) return "";

  const normalized = value.trim();
  if (["true", "1"].includes(normalized.toLowerCase())) return requesterCollege;
  if (["false", "0"].includes(normalized.toLowerCase())) return "";
  return normalized;
}

export async function findMentors(filters, requester) {
  const conditions = [
    { role: "mentor" },
    { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
  ];

  if (filters.search) {
    conditions.push({ $text: { $search: filters.search } });
  }

  const skills = normalizeSkills(filters.skills);
  if (skills.length > 0) {
    conditions.push({
      skills: { $in: skills.map((skill) => new RegExp(`^${escapeRegex(skill)}$`, "i")) },
    });
  }

  if (filters.college) {
    conditions.push({ college: new RegExp(escapeRegex(filters.college), "i") });
  }

  const almaMater = almaMaterFilter(filters.almaMater, requester.college || "");
  if (almaMater) {
    conditions.push({ college: new RegExp(escapeRegex(almaMater), "i") });
  }

  if (filters.company) {
    conditions.push({ "mentorProfile.company": new RegExp(escapeRegex(filters.company), "i") });
  }

  const filter = { $and: conditions };
  const skip = (filters.page - 1) * filters.limit;
  const selection = { ...mentorProjection };
  if (filters.search) selection.score = { $meta: "textScore" };

  const mentorQuery = User.find(filter)
    .select(selection)
    .skip(skip)
    .limit(filters.limit);

  if (filters.search) {
    mentorQuery.sort({ score: { $meta: "textScore" }, name: 1 });
  } else {
    mentorQuery.sort({ name: 1, _id: 1 });
  }

  const [total, documents] = await Promise.all([
    User.countDocuments(filter),
    mentorQuery.lean(),
  ]);

  return {
    mentors: documents.map((document) => {
      const mentor = { ...document };
      delete mentor.score;
      return mentor;
    }),
    pagination: {
      total,
      page: filters.page,
      pages: Math.ceil(total / filters.limit),
      limit: filters.limit,
    },
  };
}