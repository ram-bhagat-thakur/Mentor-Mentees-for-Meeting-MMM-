import { useState } from "react";
import { useNavigate } from "react-router-dom";
import roomService from "../../services/roomService.js";

function getInitials(name = "Mentor") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function LiveRoomCard({ room, onRoomUpdated }) {
  const host = room.hostId || {};
  const topics = room.topics || [];
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function handleJoin() {
    setIsJoining(true);
    setJoinError("");
    try {
      const result = await roomService.joinRoom(room._id);
      onRoomUpdated?.(result.room);
      navigate(`/rooms/${room._id}`);
    } catch (error) {
      setJoinError(error.message);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <article className="flex min-h-60 flex-col rounded-card border border-slate-200 bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex min-h-7 items-center gap-2 rounded-full bg-status-live-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-status-live-500" aria-hidden="true" />
          Live now
        </span>
        <span className="text-xs font-medium text-slate-500">
          {room.participantCount} {room.participantCount === 1 ? "participant" : "participants"}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-6 text-slate-900">{room.title}</h3>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
        {room.description || "Join the conversation with a mentor and fellow students."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {topics.slice(0, 3).map((topic) => (
          <span
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            key={topic}
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {getInitials(host.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-900">{host.name || "Mentor"}</span>
            <span className="block truncate text-xs text-slate-500">
              {[host.mentorProfile?.company, host.college].filter(Boolean).join(" · ")}
            </span>
          </span>
        </div>
        <button
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-button bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          disabled={isJoining}
          onClick={handleJoin}
          type="button"
        >
          {isJoining ? "Joining" : "Join Room"}
        </button>
      </div>
      {joinError && <p className="mt-2 text-xs text-status-error-700" role="alert">{joinError}</p>}
    </article>
  );
}