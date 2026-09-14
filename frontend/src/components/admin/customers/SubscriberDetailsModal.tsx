import { X } from "lucide-react";

import type { NewsletterSubscriber } from "../../../services/newsletterService";

interface SubscriberDetailsModalProps {
  subscriber: NewsletterSubscriber;
  onClose: () => void;
}

export default function SubscriberDetailsModal({
  subscriber,
  onClose,
}: SubscriberDetailsModalProps) {
  return (
    <div className="admin-modal-portal fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">

      <div
        className="
          w-full
          rounded-t-3xl
          border
          border-white/10
          bg-[#111113]
          p-6
          shadow-2xl
          sm:max-w-md
          sm:rounded-3xl
        "
      >

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Subscriber
            </p>

            <h2 className="mt-1 text-xl font-medium">
              Details
            </h2>
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

        <div className="mt-6 space-y-3">

          <Detail
            label="Email"
            value={subscriber.email}
          />

          <Detail
            label="Status"
            value={
              subscriber.active
                ? "Active"
                : "Inactive"
            }
          />

          <Detail
            label="Subscribed"
            value={new Date(
              subscriber.subscribed_at,
            ).toLocaleString()}
          />

        </div>

      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">

      <p className="text-xs uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-white/70">
        {value}
      </p>

    </div>
  );
}