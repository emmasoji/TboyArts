import type { LucideIcon } from "lucide-react";

interface OrderStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export default function OrderStatCard({
  label,
  value,
  icon: Icon,
}: OrderStatCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--admin-border)]
        bg-[var(--admin-surface)]
        p-5
        transition
        hover:border-white/15
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
            {label}
          </p>

          <p className="mt-3 text-2xl font-medium text-white">
            {value}
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[var(--admin-surface-soft)]
            text-white/50
          "
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
