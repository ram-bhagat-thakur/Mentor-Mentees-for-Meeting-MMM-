import { useEffect, useState } from "react";
import EmptyState from "../components/common/EmptyState.jsx";
import SkeletonCard from "../components/common/SkeletonCard.jsx";
import LiveRoomCard from "../components/dashboard/LiveRoomCard.jsx";
import MentorSearch from "../components/dashboard/MentorSearch.jsx";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout.jsx";
import useSocket from "../hooks/useSocket.js";
import { useAuth } from "../context/AuthContext.jsx";
import roomService from "../services/roomService.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  function handleFeedStatusChange(payload) {
    if (!payload?.room?._id) return;

    setRooms((currentRooms) => {
      const roomId = payload.room._id;
      if (payload.action === "ended" || payload.room.status !== "ongoing") {
        return currentRooms.filter((room) => room._id !== roomId);
      }

      const withoutUpdatedRoom = currentRooms.filter((room) => room._id !== roomId);
      return [payload.room, ...withoutUpdatedRoom];
    });
  }

  const { isConnected } = useSocket({ onFeedStatusChange: handleFeedStatusChange });

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    roomService
      .getLiveRooms({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setRooms(result);
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.name === "AbortError") return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [refreshCount]);

  return (
    <WorkspaceLayout>
      <main className="container py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
              Mentorship, in motion
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Find your next useful conversation.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Join a live room or find a mentor who understands where you want to go.
            </p>
          </div>
          <div className="rounded-card border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Your campus</p>
            <p className="mt-1 max-w-56 truncate text-sm font-semibold text-slate-900">
              {user?.college || "College not set"}
            </p>
          </div>
        </div>

        <section aria-labelledby="live-rooms-title" className="mt-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-status-live-500" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-widest text-status-live-700">Live now</p>
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900" id="live-rooms-title">
                Open rooms
              </h2>
            </div>
            {!isLoading && !error && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">
                  {rooms.length} {rooms.length === 1 ? "room" : "rooms"} active
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-status-live-500" : "bg-slate-300"}`} />
                  {isConnected ? "Live updates on" : "Reconnecting"}
                </span>
              </div>
            )}
          </div>

          {error ? (
            <div role="alert">
              <EmptyState
                actionLabel="Refresh rooms"
                description={error}
                onAction={() => setRefreshCount((count) => count + 1)}
                title="Live rooms could not be loaded"
              />
            </div>
          ) : isLoading ? (
            <div aria-label="Loading live rooms" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonCard key={index} variant="room" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <EmptyState
              actionLabel="Refresh rooms"
              description="There are no live mentor sessions at the moment. Check back soon or explore the directory below."
              onAction={() => setRefreshCount((count) => count + 1)}
              title="No live rooms right now"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <LiveRoomCard key={room._id} onRoomUpdated={handleFeedStatusChange} room={room} />
              ))}
            </div>
          )}
        </section>

        <MentorSearch currentCollege={user?.college || ""} />
      </main>
    </WorkspaceLayout>
  );
}