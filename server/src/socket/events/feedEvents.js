export function serializeFeedRoom(room) {
  const host = room.hostId?.toObject ? room.hostId.toObject() : room.hostId;

  return {
    _id: room._id.toString(),
    title: room.title,
    description: room.description,
    topics: room.topics,
    status: room.status,
    scheduledAt: room.scheduledAt,
    createdAt: room.createdAt,
    maxParticipants: room.maxParticipants,
    participantCount: room.activeParticipants.length,
    hostId: host
      ? {
          _id: host._id.toString(),
          name: host.name,
          college: host.college,
          mentorProfile: host.mentorProfile
            ? { company: host.mentorProfile.company }
            : undefined,
        }
      : null,
  };
}

export function broadcastFeedStatus(io, action, room) {
  if (!io || !["created", "updated", "ended"].includes(action)) {
    return false;
  }

  io.emit("feed:status_change", {
    action,
    room: serializeFeedRoom(room),
  });
  return true;
}