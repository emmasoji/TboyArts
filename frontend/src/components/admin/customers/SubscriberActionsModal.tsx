import {
  Eye,
  Power,
  Trash2,
  X,
} from "lucide-react";

import type { NewsletterSubscriber } from "../../../services/newsletterService";
import { createPortal } from "react-dom";

interface SubscriberActionsModalProps {
  subscriber: NewsletterSubscriber;
  onClose: () => void;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-4
        py-3
        text-left
        text-sm
        transition
        ${
          danger
            ? "text-red-400 hover:bg-red-400/10"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      <span className="shrink-0">
        {icon}
      </span>

      <span>
        {label}
      </span>
    </button>
  );
}

export default function SubscriberActionsModal({
  subscriber,
  onClose,
  onView,
  onToggleStatus,
  onDelete,
}: SubscriberActionsModalProps) {
  const active = subscriber.active;

  return createPortal(
    <div className="admin-modal-portal fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm">
      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          rounded-t-3xl
          border
          border-white/10
          bg-[#111113]
          shadow-2xl
          animate-[slideUp_0.25s_ease-out]
          sm:left-1/2
          sm:right-auto
          sm:bottom-1/2
          sm:w-full
          sm:max-w-md
          sm:translate-x-[-50%]
          sm:translate-y-[50%]
          sm:rounded-3xl
        "
      >

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Subscriber Actions
            </p>

            <h2 className="mt-1 max-w-[260px] truncate text-lg font-medium">
              {subscriber.email}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white/5
              text-white/50
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close subscriber actions"
          >
            <X size={18} />
          </button>

        </div>

        {/* STATUS */}

        <div className="border-b border-white/10 px-6 py-4">

          <div className="flex items-center justify-between">

            <span className="text-xs text-white/30">
              Current status
            </span>

            <span
              className={`
                rounded-full
                px-3
                py-1
                text-xs
                ${
                  active
                    ? "bg-green-400/10 text-green-400"
                    : "bg-white/5 text-white/40"
                }
              `}
            >
              {active ? "Active" : "Inactive"}
            </span>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="space-y-2 p-4">

          <ActionButton
            icon={<Eye size={18} />}
            label="View Subscriber"
            onClick={onView}
          />

          <ActionButton
            icon={<Power size={18} />}
            label={
              active
                ? "Deactivate Subscriber"
                : "Activate Subscriber"
            }
            onClick={onToggleStatus}
          />

          <ActionButton
            icon={<Trash2 size={18} />}
            label="Delete Subscriber"
            onClick={onDelete}
            danger
          />

        </div>

      </div>
    </div>,
    document.body,
  );
}
