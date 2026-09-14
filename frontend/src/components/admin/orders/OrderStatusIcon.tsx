import {
  Clock3,
  Truck,
  CircleCheck,
  CircleSlash,
} from "lucide-react";

interface OrderStatusIconProps {
  status: string | null | undefined;
}

export default function OrderStatusIcon({
  status,
}: OrderStatusIconProps) {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ");

  /*
   * PENDING
   */
  if (normalizedStatus === "pending") {
    return (
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-yellow-400/10
          text-yellow-400
        "
        title="Pending"
      >
        <Clock3 size={17} strokeWidth={2} />
      </span>
    );
  }

  /*
   * PROCESSING
   */
  if (
    normalizedStatus === "processing" ||
    normalizedStatus === "process"
  ) {
    return (
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-blue-400/10
          text-blue-400
        "
        title="Processing"
      >
        <Clock3 size={17} strokeWidth={2} />
      </span>
    );
  }

  /*
   * SHIPPING
   *
   * Accept both "shipping" and "shipped"
   * so the truck appears regardless of
   * which wording is stored.
   */
  if (
    normalizedStatus === "shipping" ||
    normalizedStatus === "shipped" ||
    normalizedStatus === "out for delivery"
  ) {
    return (
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-[var(--admin-surface-muted)]
          text-white
        "
        title="Shipping"
      >
        <Truck size={18} strokeWidth={2.2} />
      </span>
    );
  }

  /*
   * COMPLETED
   */
  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "complete" ||
    normalizedStatus === "delivered"
  ) {
    return (
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-green-400/10
          text-green-400
        "
        title="Completed"
      >
        <CircleCheck size={18} strokeWidth={2} />
      </span>
    );
  }

  /*
   * CANCELLED
   */
  if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "cancel"
  ) {
    return (
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-red-400/10
          text-red-400
        "
        title="Cancelled"
      >
        <CircleSlash size={18} strokeWidth={2} />
      </span>
    );
  }

  /*
   * UNKNOWN STATUS
   */
  return (
    <span
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        bg-[var(--admin-surface-soft)]
        text-white/30
      "
      title={status || "Unknown"}
    >
      <Clock3 size={17} />
    </span>
  );
}
