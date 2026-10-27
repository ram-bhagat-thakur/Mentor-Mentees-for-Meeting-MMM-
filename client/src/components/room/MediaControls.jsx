import { useState } from "react";
import { Camera, CameraOff, LogOut, Mic, MicOff, PhoneOff } from "lucide-react";

export default function MediaControls({
  audioEnabled,
  videoEnabled,
  canPublish,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  onEndRoom,
  isHost,
}) {
  const [controlError, setControlError] = useState("");

  async function handleToggle(action) {
    setControlError("");
    try {
      await action();
    } catch {
      setControlError("The device setting could not be changed. Check browser permissions and try again.");
    }
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      {controlError && <p className="mb-3 text-center text-sm text-status-error-700" role="alert">{controlError}</p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
          aria-pressed={audioEnabled}
          className={`grid h-12 w-12 place-items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            audioEnabled ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100" : "border-status-error-100 bg-status-error-50 text-status-error-700"
          }`}
          disabled={!canPublish}
          onClick={() => void handleToggle(onToggleAudio)}
          type="button"
        >
          {audioEnabled ? <Mic aria-hidden="true" size={19} /> : <MicOff aria-hidden="true" size={19} />}
        </button>
        <button
          aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
          aria-pressed={videoEnabled}
          className={`grid h-12 w-12 place-items-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            videoEnabled ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100" : "border-status-error-100 bg-status-error-50 text-status-error-700"
          }`}
          disabled={!canPublish}
          onClick={() => void handleToggle(onToggleVideo)}
          type="button"
        >
          {videoEnabled ? <Camera aria-hidden="true" size={19} /> : <CameraOff aria-hidden="true" size={19} />}
        </button>

        {isHost ? (
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-button bg-status-error-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-status-error-700 focus:outline-none focus:ring-2 focus:ring-status-error-600 focus:ring-offset-2"
            onClick={onEndRoom}
            type="button"
          >
            <PhoneOff aria-hidden="true" size={16} />
            End room
          </button>
        ) : (
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={onLeave}
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            Leave room
          </button>
        )}
      </div>
      {!canPublish && (
        <p className="mt-3 text-center text-xs text-slate-500">Your microphone and camera are off while you listen.</p>
      )}
    </div>
  );
}