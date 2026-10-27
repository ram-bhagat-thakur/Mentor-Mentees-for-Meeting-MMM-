import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

function VideoTrackTile({ track, label, muted = false, status }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!track || !container) return undefined;

    try {
      track.play(container, { fit: "cover" });
    } catch {
      return undefined;
    }

    return () => {
      track.stop();
    };
  }, [track]);

  return (
    <article className="relative aspect-video min-h-52 overflow-hidden rounded-card border border-slate-700 bg-slate-900">
      {track ? (
        <div className="absolute inset-0" ref={containerRef} />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-slate-800">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-700 text-xl font-semibold text-white">
              {label.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
            </span>
            <p className="mt-3 text-sm text-slate-300">{status || "Camera off"}</p>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8">
        <span className="truncate text-sm font-medium text-white">{label}</span>
        {muted && (
          <span aria-label="Microphone muted" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/50 text-white">
            <MicOff aria-hidden="true" size={15} />
          </span>
        )}
        {!muted && track && (
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/50 text-white">
            <Mic size={15} />
          </span>
        )}
      </div>
    </article>
  );
}

export default function VideoCanvas({
  localVideoTrack,
  localVideoEnabled,
  localAudioEnabled,
  localName,
  remoteUsers,
}) {
  return (
    <section aria-label="Video participants" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {localVideoTrack && (
        <VideoTrackTile
          label={`${localName || "You"} (You)`}
          muted={!localAudioEnabled}
          status={localVideoEnabled ? "Camera starting" : "Camera is off"}
          track={localVideoEnabled ? localVideoTrack : null}
        />
      )}
      {remoteUsers.map((user) => (
        <VideoTrackTile
          key={String(user.uid)}
          label={user.name || `Participant ${user.uid}`}
          muted={!user.audioTrack}
          status="Listening"
          track={user.videoTrack || null}
        />
      ))}
    </section>
  );
}