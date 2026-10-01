import mongoose from "mongoose";

const { Schema } = mongoose;

const joinRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false, strict: "throw" },
);

const roomSchema = new Schema(
  {
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "ended"],
      default: "scheduled",
      required: true,
    },
    topics: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      default: [],
    },
    scheduledAt: { type: Date, required: true, default: Date.now },
    activeParticipants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    maxParticipants: { type: Number, min: 1, max: 100, default: 25 },
    joinRequests: { type: [joinRequestSchema], default: [] },
  },
  { timestamps: true, strict: "throw" },
);

roomSchema.pre("validate", function validateParticipants() {
  const participantIds = this.activeParticipants
    .filter((participant) => participant != null)
    .map((participant) => participant.toString());
  const requestIds = this.joinRequests
    .filter((request) => request.userId != null)
    .map((request) => request.userId.toString());

  if (participantIds.length > this.maxParticipants) {
    this.invalidate("activeParticipants", "The room exceeds maxParticipants.");
  }

  if (new Set(participantIds).size !== participantIds.length) {
    this.invalidate("activeParticipants", "A user may only appear once in activeParticipants.");
  }

  if (new Set(requestIds).size !== requestIds.length) {
    this.invalidate("joinRequests", "A user may only have one pending join request.");
  }
});

roomSchema.index({ status: 1, scheduledAt: 1 });

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

export { roomSchema };
export default Room;