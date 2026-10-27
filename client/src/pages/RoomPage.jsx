import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Radio, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState.jsx";
import MediaControls from "../components/room/MediaControls.jsx";
import RequestQueueModal from "../components/room/RequestQueueModal.jsx";
import StageRequestButton from "../components/room/StageRequestButton.jsx";
import VideoCanvas from "../components/room/VideoCanvas.jsx";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import useAgoraRoom from "../hooks/useAgoraRoom.js";
import useRoomSocket from "../hooks/useRoomSocket.js";
import roomService from "../services/roomService.js";

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [rtcRetryCount, setRtcRetryCount] = useState(0);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [promotionError, setPromotionError] = useState("");
  const promotionAttemptedRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    roomService
      .getLiveRooms({ signal: controller.signal })
      .then((rooms) => {
        if (controller.signal.aborted) return;
        const currentRoom = rooms.find((candidate) => candidate._id === roomId);
        if (currentRoom) setRoom(currentRoom);
        else setRoomError("This room is no longer live or is not available.");
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") setRoomError(error.message);
      });

    return () => controller.abort();
  }, [roomId]);

  const hostId = room?.hostId?._id || room?.hostId;
  const isHost = Boolean(hostId && user?.id === String(hostId));
  const rtc = useAgoraRoom(roomId, { enabled: Boolean(room), retryKey: rtcRetryCount });
  const roomSocket = useRoomSocket(roomId, { enabled: Boolean(room), isHost });

  useEffect(() => {
    if (!roomSocket.isConnected || !roomSocket.stageStatus || roomSocket.stageStatus !== "approved") {
      promotionAttemptedRef.current = false;
      return;
    }
    if (!rtc.isJoined || rtc.role === "PUBLISHER" || promotionAttemptedRef.current) return;

    promotionAttemptedRef.current = true;
    setPromotionError("");
    rtc.promoteToPublisher().catch((error) => {
      setPromotionError(error.message || "Stage access was granted, but your media could not be published.");
    });
  }, [roomSocket.isConnected, roomSocket.stageStatus, rtc.isJoined, rtc.role, rtc.promoteToPublisher]);

  async function retryPromotion() {
    setPromotionError("");
    try {
      await rtc.promoteToPublisher();
    } catch (error) {
      setPromotionError(error.message || "Your media could not be published. Check device permissions and retry.");
    }
  }

  async function leave() {
    setIsLeaving(true);
    try {
      if (isHost) await roomService.endRoom(roomId);
      else await roomService.leaveRoom(roomId);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setRoomError(error.message || "You could not leave this room.");
      setIsLeaving(false);
    }
  }

  return (
    <WorkspaceLayout>
      <main className="container py-6 sm:py-8">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          to="/dashboard"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to dashboard
        </Link>

        {roomError ? (
          <div className="mt-5" role="alert">
            <EmptyState
              actionLabel="Return to dashboard"
              description={roomError}
              onAction={() => navigate("/dashboard", { replace: true })}
              title="Room unavailable"
            />
          </div>
        ) : !room ? (
          <section aria-label="Joining video room" className="mt-5 animate-pulse rounded-card border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="h-5 w-40 rounded bg-slate-200" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="aspect-video rounded-card bg-slate-100" />
              <div className="aspect-video rounded-card bg-slate-100" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Loading room details…</p>
          </section>
        ) : (
          <>
            <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-status-live-700">
                  <Radio aria-hidden="true" size={14} />
                  Live room
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">{room.title}</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Hosted by {room.hostId?.name || "Mentor"} · {room.participantCount} in room
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isHost && (
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={() => setIsQueueOpen(true)}
                    type="button"
                  >
                    <Users aria-hidden="true" size={17} />
                    Requests
                    {roomSocket.requests.length > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-status-queue-500 px-1 text-xs text-white">
                        {roomSocket.requests.length}
                      </span>
                    )}
                  </button>
                )}
                <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
                  {isHost
                    ? "Host"
                    : rtc.role === "PUBLISHER"
                      ? "On stage"
                      : roomSocket.stageStatus === "approved"
                        ? "Stage approved"
                        : "Listening"}
                </span>
              </div>
            </header>

            {(rtc.mediaWarning || promotionError || roomSocket.error) && (
              <p className="mt-4 rounded-button border border-status-queue-100 bg-status-queue-50 px-4 py-3 text-sm text-status-queue-700" role="status">
                {promotionError || roomSocket.error || rtc.mediaWarning}
              </p>
            )}
            {promotionError && (
              <button
                className="mt-2 min-h-11 rounded-button border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => void retryPromotion()}
                type="button"
              >
                Retry microphone and camera
              </button>
            )}
            {room.topics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {room.topics.map((topic) => (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 rounded-card border border-slate-200 bg-slate-950 p-3 sm:p-4">
              {rtc.error ? (
                <div className="grid min-h-64 place-items-center rounded-card bg-slate-900 px-5 text-center" role="alert">
                  <div>
                    <p className="text-sm font-semibold text-white">Video is unavailable</p>
                    <p className="mt-2 max-w-lg text-sm text-slate-300">{rtc.error}</p>
                    <button
                      className="mt-4 min-h-11 rounded-button border border-slate-500 px-4 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={() => setRtcRetryCount((count) => count + 1)}
                      type="button"
                    >
                      Retry video connection
                    </button>
                  </div>
                </div>
              ) : !rtc.isJoined ? (
                <div className="grid min-h-64 place-items-center rounded-card bg-slate-900 px-5 text-center">
                  <p className="text-sm text-slate-300">Connecting video… Room controls are available while you wait.</p>
                </div>
              ) : rtc.remoteUsers.length === 0 && !rtc.localVideoTrack ? (
                <div className="grid min-h-64 place-items-center rounded-card bg-slate-900 px-5 text-center">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {rtc.role === "PUBLISHER" ? "You’re on stage" : "You’re connected and listening"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Video tiles appear when a participant publishes their camera.
                    </p>
                  </div>
                </div>
              ) : (
                <VideoCanvas
                  localAudioEnabled={rtc.isAudioEnabled}
                  localName={user?.name}
                  localVideoEnabled={rtc.isVideoEnabled}
                  localVideoTrack={rtc.localVideoTrack}
                  remoteUsers={rtc.remoteUsers}
                />
              )}
            </div>

            {user?.role === "mentee" && rtc.role !== "PUBLISHER" && (
              <div className="mt-5 flex justify-center">
                <StageRequestButton
                  isConnected={roomSocket.isConnected}
                  onRequest={roomSocket.requestStage}
                  status={roomSocket.stageStatus}
                />
              </div>
            )}

            <MediaControls
              audioEnabled={rtc.isAudioEnabled}
              canPublish={rtc.role === "PUBLISHER" && Boolean(rtc.localAudioTrack || rtc.localVideoTrack)}
              isHost={isHost}
              onEndRoom={() => void leave()}
              onLeave={() => void leave()}
              onToggleAudio={rtc.toggleAudio}
              onToggleVideo={rtc.toggleVideo}
              videoEnabled={rtc.isVideoEnabled}
            />
            {isLeaving && <p className="mt-2 text-center text-sm text-slate-500">Leaving room…</p>}
            <RequestQueueModal
              isOpen={isQueueOpen && isHost}
              onApprove={roomSocket.approveStage}
              onClose={() => setIsQueueOpen(false)}
              onReject={roomSocket.rejectStage}
              requests={roomSocket.requests}
            />
          </>
        )}
      </main>
    </WorkspaceLayout>
  );
}