import {
  Eye,
  Pencil,
  Ban,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";

import type { Order } from "../../../services/orderService";

interface OrderActionsModalProps {
  order: Order;
  onClose: () => void;
  onView: () => void;
  onUpdateStatus: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function OrderActionsModal({
  order,
  onClose,
  onView,
  onUpdateStatus,
  onCancel,
  onDelete,
}: OrderActionsModalProps) {
  const status =
    String(order.status ?? "pending").toLowerCase();

  const canCancel =
    status === "pending";

  const canDelete =
    status === "pending" ||
    status === "completed" ||
    status === "cancelled";

  const canUpdateStatus =
    status === "pending" ||
    status === "processing" ||
    status === "shipping";

  return (
    <>
      <style>{`
        @keyframes orderActionsOpen {
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

        @keyframes orderContentOpen {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .order-actions-open {
          animation: orderActionsOpen 550ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .order-content-open {
          animation: orderContentOpen 450ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both;
        }
      `}</style>

      <div
      className="tboyarts-admin-portal fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
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
          order-actions-open
          sm:left-1/2
          sm:right-auto
          sm:bottom-1/2
          sm:w-full
          sm:max-w-md
          sm:translate-x-[-50%]
          sm:translate-y-[50%]
          sm:rounded-3xl
        "
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}

        <div className="order-content-open flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Order Actions
            </p>

            <h2 className="mt-1 text-lg font-medium">
              {order.order_number || "Order"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/5
              text-white/50
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close order actions"
          >
            <X size={18} />
          </button>
        </div>

        {/* STATUS */}

        <div className="order-content-open border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">
              Current status
            </span>

            <span className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-white/60">
              {status}
            </span>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="order-content-open space-y-2 p-4">

          {/* VIEW */}

          <ActionButton
            icon={<Eye size={18} />}
            label="View Order"
            onClick={onView}
          />

          {/* UPDATE STATUS */}

          {canUpdateStatus && (
            <ActionButton
              icon={<Pencil size={18} />}
              label="Update Status"
              onClick={onUpdateStatus}
            />
          )}

          {/* CANCEL */}

          {canCancel && (
            <ActionButton
              icon={<Ban size={18} />}
              label="Cancel Order"
              onClick={onCancel}
              danger
            />
          )}

          {/* DELETE */}

          {canDelete && (
            <ActionButton
              icon={<Trash2 size={18} />}
              label="Delete Order"
              onClick={onDelete}
              danger
            />
          )}

        </div>

        {/* RULE INFORMATION */}

        <div className="order-content-open border-t border-white/10 px-6 py-4">
          <p className="text-center text-[11px] leading-5 text-white/25">
            {status === "pending" &&
              "Pending orders can be cancelled or deleted."}

            {status === "processing" &&
              "Processing orders can only be progressed to shipping or completed."}

            {status === "shipping" &&
              "Shipping orders can only be progressed to completed."}

            {status === "completed" &&
              "Completed orders can be deleted."}

            {status === "cancelled" &&
              "Cancelled orders can be deleted."}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex
        w-full
        items-center
        gap-4
        rounded-2xl
        px-4
        py-4
        text-left
        transition
        ${
          danger
            ? "text-red-400 hover:bg-red-400/10"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      <span
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            danger
              ? "bg-red-400/10"
              : "bg-white/5"
          }
        `}
      >
        {icon}
      </span>

      <span className="flex-1 text-sm font-medium">
        {label}
      </span>

      <ChevronRight
        size={16}
        className="text-white/20"
      />
    </button>
  );
}
