import Room from "../models/Room.js";

export async function listLiveRooms() {
  const rooms = await Room.find({ status: "ongoing" })
    .select("title description topics status scheduledAt hostId activeParticipants maxParticipants createdAt")
    .populate({
      path: "hostId",
      select: "name college mentorProfile.company",
    })
    .sort({ createdAt: -1, _id: -1 })
    .limit(24)
    .lean();

  return rooms
    .filter((room) => room.hostId)
    .map(({ activeParticipants, ...room }) => ({
      ...room,
      participantCount: activeParticipants.length,
    }));
}