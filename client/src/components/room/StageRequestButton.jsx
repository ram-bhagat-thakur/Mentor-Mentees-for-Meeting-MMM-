import { Hand, LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function StageRequestButton({ isConnected, onRequest, status }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isPending = status === "pending";
  const isApproved = status === "approved";

  async function handleRequest() {
    setIsSubmitting(true);
    setError("");
    try {
      await onRequest();
    } catch (requestError) {
      setError(requestError.message || "The request could not be sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-button px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          isPending || isApproved
            ? "border border-status-queue-200 bg-status-queue-50 text-status-queue-800"
            : "bg-primary-500 text-white hover:bg-primary-600"
        }`}
        disabled={!isConnected || isSubmitting || isPending || isApproved}
        onClick={() => void handleRequest()}
        type="button"
      >
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Hand aria-hidden="true" size={17} />}
        {isApproved ? "Stage approved" : isPending ? "Pending approval" : status === "rejected" ? "Request again" : "Request stage"}
      </button>
      {status === "rejected" && <span className="text-xs text-slate-500">Your request was declined.</span>}
      {error && <span className="text-xs text-status-error-700" role="alert">{error}</span>}
      {!isConnected && <span className="text-xs text-slate-500">Connecting to room controls…</span>}
    </div>
  );
}