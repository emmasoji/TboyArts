import { AlertTriangle, X } from "lucide-react";

import type { NewsletterSubscriber } from "../../../services/newsletterService";

interface DeleteSubscriberModalProps {
  subscriber: NewsletterSubscriber;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteSubscriberModal({
  subscriber,
  onClose,
  onConfirm,
}: DeleteSubscriberModalProps) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">

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
          animate-[scaleIn_0.2s_ease-out]
        "
      >

        <div className="flex items-start justify-between">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-400/10 text-red-400">
            <AlertTriangle size={20} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>

        <h2 className="mt-5 text-xl font-medium">
          Delete subscriber?
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/40">
          This will permanently remove
          <span className="mx-1 text-white/70">
            {subscriber.email}
          </span>
          from your newsletter subscribers.
        </p>

        <p className="mt-2 text-xs text-red-400/70">
          This action cannot be undone.
        </p>

        <div className="mt-6 flex gap-3">

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Keep Subscriber
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-500/90"
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
}
