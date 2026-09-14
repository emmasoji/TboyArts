import { Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

import type {
  NewsletterSubscriber,
} from "../../../../services/newsletterService";

interface DeleteSubscriberModalProps {
  subscriber: NewsletterSubscriber;
  deleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteSubscriberModal({
  subscriber,
  deleting = false,
  error = null,
  onClose,
  onConfirm,
}: DeleteSubscriberModalProps) {
  return createPortal(
    <div className="admin-modal-portal fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-white/10
          bg-[#111113]
          p-6
          shadow-2xl
          animate-[slideUp_0.25s_ease-out]
          sm:animate-[fadeIn_0.2s_ease-out]
        "
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
              <Trash2 size={19} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                Delete Subscriber
              </p>

              <h2 className="mt-1 text-lg font-medium">
                Remove subscriber?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close delete confirmation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="break-all text-sm text-white/70">
            {subscriber.email}
          </p>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/40">
          This subscriber will be permanently removed from your
          newsletter subscriber list. This action cannot be undone.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
            <p className="text-sm leading-6 text-red-400">
              {error}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="
              flex-1
              rounded-xl
              border
              border-white/10
              px-4
              py-3
              text-sm
              text-white/60
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            Keep Subscriber
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="
              flex-1
              rounded-xl
              bg-red-400
              px-4
              py-3
              text-sm
              font-medium
              text-black
              transition
              hover:bg-red-300
            "
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
