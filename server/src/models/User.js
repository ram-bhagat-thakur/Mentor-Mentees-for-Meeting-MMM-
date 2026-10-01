import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { Schema } = mongoose;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const pricingSchema = new Schema(
  {
    hourlyRate: { type: Number, min: 0, default: 0 },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
      default: "USD",
    },
  },
  { _id: false, strict: "throw" },
);

const availabilitySchema = new Schema(
  {
    dayOfWeek: { type: String, enum: weekdays, required: true },
    startTime: { type: String, match: timePattern, required: true },
    endTime: { type: String, match: timePattern, required: true },
    timezone: { type: String, trim: true, default: "UTC" },
  },
  { _id: false, strict: "throw" },
);

availabilitySchema.pre("validate", function validateAvailability() {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate("endTime", "Availability end time must be later than its start time.");
  }
});

const ratingSchema = new Schema(
  {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, min: 0, default: 0 },
  },
  { _id: false, strict: "throw" },
);

const mentorProfileSchema = new Schema(
  {
    company: { type: String, trim: true, maxlength: 120 },
    jobTitle: { type: String, trim: true, maxlength: 120 },
    pricing: { type: pricingSchema, default: () => ({}) },
    availability: { type: [availabilitySchema], default: [] },
    domain: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
      alias: "domainExpertise",
    },
    rating: { type: ratingSchema, default: () => ({}) },
  },
  { _id: false, strict: "throw" },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: emailPattern,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["mentee", "mentor"] },
    college: { type: String, required: true, trim: true, maxlength: 160 },
    isActive: { type: Boolean, default: true, index: true },
    skills: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
    },
    bio: {
      type: [{ type: String, trim: true, maxlength: 500 }],
      default: [],
    },
    mentorProfile: {
      type: mentorProfileSchema,
      default() {
        return this.role === "mentor" ? {} : undefined;
      },
      required() {
        return this.role === "mentor";
      },
      validate: {
        validator(profile) {
          return this.role === "mentor" || profile == null;
        },
        message: "Only mentor accounts may include a mentor profile.",
      },
    },
  },
  { timestamps: true, strict: "throw" },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index(
  {
    skills: "text",
    college: "text",
    "mentorProfile.domain": "text",
    name: "text",
    "mentorProfile.company": "text",
  },
  {
    name: "mentor_search_text",
    weights: {
      skills: 10,
      name: 8,
      "mentorProfile.domain": 6,
      "mentorProfile.company": 4,
      college: 2,
    },
  },
);
userSchema.index({ role: 1, isActive: 1, college: 1 });
userSchema.index({ role: 1, isActive: 1, "mentorProfile.company": 1 });
userSchema.index({ role: 1, isActive: 1, skills: 1 });

userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export { userSchema };
export default User;