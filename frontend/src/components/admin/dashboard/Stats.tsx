import {
  Palette,
  ShoppingBag,
  Users,
  Banknote,
} from "lucide-react";

const stats = [
  {
    label: "Artworks",
    value: "11",
    icon: Palette,
  },
  {
    label: "Orders",
    value: "0",
    icon: ShoppingBag,
  },
  {
    label: "Customers",
    value: "0",
    icon: Users,
  },
  {
    label: "Revenue",
    value: "₦0",
    icon: Banknote,
  },
];

export default function Stats() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-[#101010] p-5 shadow-[8px_8px_20px_#050505,-8px_-8px_20px_#151515]"
          >
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b0b0b] shadow-[inset_3px_3px_8px_#050505,inset_-3px_-3px_8px_#171717]">
              <Icon size={19} />
            </div>

            <p className="text-sm text-white/40">
              {stat.label}
            </p>

            <strong className="mt-2 block text-2xl font-medium">
              {stat.value}
            </strong>
          </article>
        );
      })}

    </div>
  );
}