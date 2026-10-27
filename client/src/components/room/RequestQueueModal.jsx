import { Check, X } from "lucide-react";
import { useState } from "react";

export default function RequestQueueModal({ isOpen, onClose, requests, onApprove, onReject }) {
  const [pendingUserId, setPendingUserId] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleDecision(action, userId) {
    setPendingUserId(userId);
    setError("");
    try {
      await action(userId);
    } catch (decisionError) {
      setError(decisionError.message || "The request could not be updated.");
    } finally {
      setPendingUserId("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pendingUserId) onClose();
      }}
    >
      <section
        aria-labelledby="request-queue-title"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-card border border-slate-200 bg-white p-5 shadow-xl sm:rounded-card sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900" id="request-queue-title">Stage requests</h2>
            <p className="mt-1 text-sm text-slate-600">Review attendees before enabling their microphone and camera.</p>
          </div>
          <button
            aria-label="Close stage requests"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-button text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-button bg-status-error-50 px-3 py-2 text-sm text-status-error-700" role="alert">{error}</p>}
        {requests.length === 0 ? (
          <p className="mt-6 rounded-button bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No pending stage requests.</p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-100">
            {requests.map((request) => (
              <li className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between" key={request.userId}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{request.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{request.college || "College not provided"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(request.skills || []).length ? request.skills.slice(0, 5).map((skill) => (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700" key={skill}>{skill}</span>
                    )) : <span className="text-xs text-slate-400">No skills listed</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    aria-label={`Approve ${request.name}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-button bg-status-live-600 px-3 text-sm font-semibold text-white hover:bg-status-live-700 focus:outline-none focus:ring-2 focus:ring-status-live-500 focus:ring-offset-2 disabled:opacity-60"
                    disabled={Boolean(pendingUserId)}
                    onClick={() => void handleDecision(onApprove, request.userId)}
                    type="button"
                  >
                    <Check aria-hidden="true" size={16} /> Approve
                  </button>
                  <button
                    aria-label={`Reject ${request.name}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60"
                    disabled={Boolean(pendingUserId)}
                    onClick={() => void handleDecision(onReject, request.userId)}
                    type="button"
                  >
                    <X aria-hidden="true" size={16} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}