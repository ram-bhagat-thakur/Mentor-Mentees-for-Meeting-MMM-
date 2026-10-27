import { useEffect, useState } from "react";
import { X } from "lucide-react";
import roomService from "../../services/roomService.js";

const initialForm = {
  title: "",
  description: "",
  topics: "",
  maxParticipants: "25",
};

const fieldClasses =
  "min-h-11 w-full rounded-button border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

export default function CreateRoomModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setForm(initialForm);
    setError("");

    function handleEscape(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.title.trim();
    const maxParticipants = Number(form.maxParticipants);

    if (!title) {
      setError("Add a title for your room.");
      return;
    }
    if (!Number.isInteger(maxParticipants) || maxParticipants < 1 || maxParticipants > 100) {
      setError("Choose a speaker limit between 1 and 100.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const topics = [...new Set(form.topics.split(",").map((topic) => topic.trim()).filter(Boolean))];
      const result = await roomService.createRoom({
        title,
        description: form.description.trim(),
        topics,
        maxParticipants,
      });
      onCreated(result.room);
    } catch (requestError) {
      setError(requestError.message || "The room could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        aria-labelledby="create-room-title"
        aria-modal="true"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-card border border-slate-200 bg-surface p-5 shadow-xl sm:rounded-card sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">
              Host a conversation
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900" id="create-room-title">
              Start a live room
            </h2>
            <p className="mt-2 text-sm text-slate-600">Give students a clear topic and room limit.</p>
          </div>
          <button
            aria-label="Close room creation"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-button text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-button border border-status-error-100 bg-status-error-50 px-4 py-3 text-sm text-status-error-700" role="alert">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="room-title">
              Room title
            </label>
            <input
              autoFocus
              className={fieldClasses}
              id="room-title"
              maxLength={160}
              name="title"
              onChange={updateField}
              placeholder="e.g. Portfolio feedback for early-career designers"
              value={form.title}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="room-description">
              Description <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <textarea
              className={`${fieldClasses} min-h-24 resize-y py-3`}
              id="room-description"
              maxLength={2000}
              name="description"
              onChange={updateField}
              placeholder="What will attendees leave knowing or doing?"
              value={form.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="room-topics">
                Topics
              </label>
              <input
                className={fieldClasses}
                id="room-topics"
                name="topics"
                onChange={updateField}
                placeholder="Portfolio, career growth"
                value={form.topics}
              />
              <p className="mt-1.5 text-xs text-slate-500">Separate topics with commas.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor="room-capacity">
                Speaker limit
              </label>
              <input
                className={fieldClasses}
                id="room-capacity"
                max={100}
                min={1}
                name="maxParticipants"
                onChange={updateField}
                type="number"
                value={form.maxParticipants}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              className="min-h-11 rounded-button border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-primary-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isSubmitting ? "Starting room" : "Start live room"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}