import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  X,
  Clock3,
  Truck,
  CircleCheck,
} from "lucide-react";
import type {
  Order,
  OrderStatus,
} from "../../../services/orderService";

interface UpdateOrderStatusModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: (status: OrderStatus) => Promise<void>;
}

interface NextStatus {
  value: OrderStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}

function getNextStatus(
  status: OrderStatus,
): NextStatus | null {
  if (status === "pending") {
    return {
      value: "processing",
      label: "Processing",
      description: "Begin processing this order.",
      icon: <Clock3 size={18} />,
    };
  }

  if (status === "processing") {
    return {
      value: "shipping",
      label: "Shipping",
      description: "Mark the order as shipped.",
      icon: <Truck size={18} />,
    };
  }

  if (status === "shipping") {
    return {
      value: "completed",
      label: "Completed",
      description: "Mark the order as successfully completed.",
      icon: <CircleCheck size={18} />,
    };
  }

  return null;
}

export default function UpdateOrderStatusModal({
  order,
  onClose,
  onUpdate,
}: UpdateOrderStatusModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = order.status;
  const nextStatus = getNextStatus(currentStatus);

  async function handleUpdate() {
    if (!nextStatus || saving) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onUpdate(nextStatus.value);
      onClose();
    } catch (err) {
      console.error(
        "UPDATE ORDER STATUS ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update order status.",
      );
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <>
      <style>{`
        @keyframes orderStatusBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes orderStatusOpen {
          from {
            opacity: 0;
            transform: translateY(70px) scale(0.97);
          }

          60% {
            opacity: 1;
            transform: translateY(-5px) scale(1);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes orderStatusContent {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .order-status-backdrop {
          animation:
            orderStatusBackdrop
            350ms
            ease-out
            both;
        }

        .order-status-open {
          animation:
            orderStatusOpen
            550ms
            cubic-bezier(0.16, 1, 0.3, 1)
            both;
        }

        .order-status-content {
          animation:
            orderStatusContent
            450ms
            cubic-bezier(0.16, 1, 0.3, 1)
            100ms
            both;
        }
      `}</style>

      <div
        className="
          tboyarts-admin-portal
          fixed
          inset-0
          z-[120]
          flex
          items-end
          justify-center
          bg-black/60
          backdrop-blur-sm
          sm:items-center
        "
        role="presentation"
      >
        {/* BACKDROP */}

        <div
          className="
            order-status-backdrop
            absolute
            inset-0
            bg-black/60
          "
          onClick={saving ? undefined : onClose}
          role="presentation"
        />

        {/* MODAL */}

        <div
          className="
            relative
            z-10
            w-full
            rounded-t-3xl
            border
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
            p-6
            text-[var(--admin-text)]
            shadow-2xl
            order-status-open
            sm:max-w-md
            sm:rounded-3xl
          "
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* HEADER */}

          <div className="order-status-content mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                Update Status
              </p>

              <h2 className="mt-1 text-xl font-medium text-[var(--admin-text)]">
                {order.order_number || "Order"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-white/5
                text-[var(--admin-text-muted)]
                transition
                hover:bg-[var(--admin-surface-soft)]
                hover:text-[var(--admin-text)]
                disabled:opacity-40
              "
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* CURRENT STATUS */}

          <div
            className="
              order-status-content
              mb-5
              rounded-2xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface-soft)]
              p-4
            "
            style={{ animationDelay: "150ms" }}
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-text-faint)]">
              Current status
            </p>

            <p className="mt-2 text-sm font-medium capitalize text-[var(--admin-text)]">
              {currentStatus}
            </p>
          </div>

          {/* NEXT STATUS */}

          {nextStatus ? (
            <div
              className="order-status-content"
              style={{ animationDelay: "200ms" }}
            >
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[var(--admin-text-faint)]">
                Next step
              </p>

              <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-[var(--admin-text-muted)]">
                    {nextStatus.icon}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--admin-text)]">
                      {nextStatus.label}
                    </p>

                    <p className="mt-1 text-xs text-[var(--admin-text-faint)]">
                      {nextStatus.description}
                    </p>
                  </div>

                  <Check
                    size={17}
                    className="text-[var(--admin-text-faint)]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="
                order-status-content
                rounded-2xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface-soft)]
                p-5
                text-center
              "
              style={{ animationDelay: "200ms" }}
            >
              <p className="text-sm text-[var(--admin-text-muted)]">
                This order has reached its final status.
              </p>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <p
              className="
                order-status-content
                mt-4
                rounded-xl
                bg-red-400/10
                px-4
                py-3
                text-sm
                text-red-400
              "
              style={{ animationDelay: "250ms" }}
            >
              {error}
            </p>
          )}

          {/* BUTTONS */}

          <div
            className="
              order-status-content
              mt-6
              flex
              gap-3
            "
            style={{ animationDelay: "300ms" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                flex-1
                rounded-xl
                border
                border-[var(--admin-border)]
                px-4
                py-3
                text-sm
                text-[var(--admin-text-muted)]
                transition
                hover:bg-[var(--admin-surface-soft)]
                hover:text-[var(--admin-text)]
                disabled:opacity-40
              "
            >
              Close
            </button>

            {nextStatus && (
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="
                  flex-1
                  rounded-xl
                  bg-[var(--admin-action-bg)]
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-[var(--admin-action-text)]
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving
                  ? "Updating..."
                  : `Move to ${nextStatus.label}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
