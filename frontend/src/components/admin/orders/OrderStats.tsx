import {
  Banknote,
  Clock3,
  CircleCheck,
  CircleSlash,
} from "lucide-react";

import OrderStatCard from "./OrderStatCard";

export default function OrderStats() {
  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >
      <OrderStatCard
        label="Revenue"
        value="₦250,000"
        icon={Banknote}
      />

      <OrderStatCard
        label="Pending"
        value="8"
        icon={Clock3}
      />

      <OrderStatCard
        label="Completed"
        value="24"
        icon={CircleCheck}
      />

      <OrderStatCard
        label="Cancelled"
        value="3"
        icon={CircleSlash}
      />
    </div>
  );
}
