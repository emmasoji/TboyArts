import { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

import type { Order } from "../../../services/orderService";

interface DeleteOrderModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteOrderModal({
  order,
  onClose,
  onConfirm,
}: DeleteOrderModalProps) {
  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleDelete() {
    if (deleting) return;

    try {
      setDeleting(true);
      setError(null);

      await onConfirm();
    } catch (err) {
      console.error(
        "DELETE ORDER MODAL ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete order.",
      );

      setDeleting(false);
    }
  }

  return createPortal(
    <div className="admin-modal-portal fixed inset-0 z-[140] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div
        className={`
          w-full
          rounded-t-3xl
          border
          border-white/10
          bg-[#111113]
          p-6
          shadow-2xl
          sm:max-w-md
          sm:rounded-3xl
          ${
            deleting
              ? "animate-pulse"
              : "animate-[slideUp_0.25s_ease-out]"
          }
        `}
      >
        {!deleting ? (
          <>
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
                <AlertTriangle size={22} />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Close delete modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5">
              <h2 className="text-xl font-medium">
                Delete Order?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                You are about to permanently delete
                {" "}
                <span className="text-white/80">
                  {order.order_number || "this order"}
                </span>
                . This action cannot be undone.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3">
                <p className="text-sm text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-500/90"
              >
                <Trash2 size={17} />
                Delete Order
              </button>
            </div>
          </>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-red-400">
              <Loader2
                size={30}
                className="animate-spin"
              />

              <Trash2
                size={13}
                className="absolute"
              />
            </div>

            <h2 className="mt-6 text-xl font-medium">
              Deleting Order
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Removing {order.order_number || "order"}...
            </p>

            <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-[slideRight_1s_ease-in-out_infinite] rounded-full bg-red-400" />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
