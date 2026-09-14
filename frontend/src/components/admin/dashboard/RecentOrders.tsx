export default function RecentOrders() {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101010] p-6 shadow-[8px_8px_20px_#050505,-8px_-8px_20px_#151515]">

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
          Orders
        </p>

        <h2 className="mt-2 text-xl">
          Recent orders
        </h2>
      </div>

      <div className="flex min-h-32 items-center justify-center">
        <p className="text-sm text-white/30">
          No orders yet.
        </p>
      </div>

    </article>
  );
}