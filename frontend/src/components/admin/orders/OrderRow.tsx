import { MoreVertical } from "lucide-react";

import type { Order } from "../../../services/orderService";
import OrderStatusIcon from "./OrderStatusIcon";

interface OrderRowProps {
  order: Order;
  onClick: (order: Order) => void;
}

export default function OrderRow({
  order,
  onClick,
}: OrderRowProps) {
  return (
    <tr className="group bg-white transition-colors hover:bg-[var(--admin-surface-soft)] [html[data-admin-theme=dark]_&]:bg-[var(--admin-surface)]">

      {/* STATUS ICON */}

      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
        <OrderStatusIcon status={order.status} />
      </td>

      {/* ORDER NUMBER */}

      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
        <span className="text-sm font-medium text-[var(--admin-text)]">
          {order.order_number || "—"}
        </span>
      </td>

      {/* CUSTOMER */}

      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
        <span className="text-sm text-[var(--admin-text-muted)]">
          {order.customer || "Guest Customer"}
        </span>
      </td>

      {/* TOTAL */}

      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
        <span className="text-sm text-[var(--admin-text-muted)]">
          ₦{Number(order.total ?? 0).toLocaleString()}
        </span>
      </td>

      {/* STATUS */}

      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
        <span className="text-sm capitalize text-[var(--admin-text-muted)]">
          {order.status}
        </span>
      </td>

      {/* ACTION */}

      <td className="sticky right-0 z-10 border-b border-l border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4">
        <button
          type="button"
          onClick={() => onClick(order)}
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            text-[var(--admin-text-faint)]
            transition
            hover:bg-[var(--admin-surface-soft)]
            hover:text-[var(--admin-text)]
          "
          aria-label={`Actions for ${
            order.order_number || "order"
          }`}
        >
          <MoreVertical size={18} />
        </button>
      </td>

    </tr>
  );
}
