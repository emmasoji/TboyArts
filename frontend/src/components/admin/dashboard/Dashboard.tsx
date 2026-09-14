import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  HardDrive,
  Palette,
  Plus,
  RefreshCw,
  ShoppingBag,
  Users,
} from "lucide-react";

import { useAdminTheme } from "../../../contexts/AdminThemeContext";
import { supabase } from "../../../lib/supabase";
import ErrorState from "../../errors/ErrorState";
import Storage from "./Storage";
import type { AdminSection } from "../AdminLayout";

type DashboardProps = {
  onNavigate?: (section: AdminSection) => void;
};

type DashboardOrder = {
  id: string;
  order_number: string;
  customer_name: string | null;
  email: string | null;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
};

const quickActions: {
  label: string;
  section: AdminSection;
  icon: typeof Plus;
}[] = [
  {
    label: "Add Artwork",
    section: "artworks",
    icon: Plus,
  },
  {
    label: "Manage Artworks",
    section: "artworks",
    icon: Palette,
  },
  {
    label: "View Orders",
    section: "orders",
    icon: ShoppingBag,
  },
  {
    label: "Customers",
    section: "customers",
    icon: Users,
  },
  {
    label: "Settings",
    section: "settings",
    icon: HardDrive,
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { theme } = useAdminTheme();
  const light = theme === "light";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [artworkCount, setArtworkCount] = useState(0);
  const [availableArtworks, setAvailableArtworks] = useState(0);

  const [orderCount, setOrderCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);

  const [customerCount, setCustomerCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [
        artworksResult,
        ordersResult,
      ] = await Promise.all([
        supabase
          .from("artworks")
          .select("id, status"),

        supabase
          .from("orders")
          .select(
            "id, order_number, customer_name, email, total, status, payment_status, created_at",
          )
          .order("created_at", { ascending: false }),
      ]);

      if (artworksResult.error) {
        throw artworksResult.error;
      }

      if (ordersResult.error) {
        throw ordersResult.error;
      }

      const artworks = artworksResult.data ?? [];
      const orders = (ordersResult.data ?? []) as DashboardOrder[];

      const available = artworks.filter(
        (artwork) =>
          String(artwork.status ?? "").toLowerCase() === "available",
      ).length;

      const pending = orders.filter((order) =>
        ["pending", "processing", "shipping"].includes(
          String(order.status).toLowerCase(),
        ),
      ).length;

      const completed = orders.filter(
        (order) =>
          String(order.status).toLowerCase() === "completed",
      ).length;

      const uniqueCustomers = new Set(
        orders
          .map((order) => String(order.email ?? "").trim().toLowerCase())
          .filter(Boolean),
      );

      const completedRevenue = orders
        .filter(
          (order) =>
            String(order.status).toLowerCase() === "completed" ||
            String(order.payment_status).toLowerCase() === "paid",
        )
        .reduce(
          (sum, order) => sum + Number(order.total || 0),
          0,
        );

      setArtworkCount(artworks.length);
      setAvailableArtworks(available);

      setOrderCount(orders.length);
      setPendingOrders(pending);
      setCompletedOrders(completed);

      setCustomerCount(uniqueCustomers.size);
      setRevenue(completedRevenue);

      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(
    () => [
      {
        label: "Total Artworks",
        value: artworkCount.toLocaleString(),
        detail: `${availableArtworks} available`,
        icon: Palette,
      },
      {
        label: "Orders",
        value: orderCount.toLocaleString(),
        detail: `${pendingOrders} active`,
        icon: ShoppingBag,
      },
      {
        label: "Customers",
        value: customerCount.toLocaleString(),
        detail: "Registered customers",
        icon: Users,
      },
      {
        label: "Revenue",
        value: formatCurrency(revenue),
        detail: `${completedOrders} completed`,
        icon: Banknote,
      },
    ],
    [
      artworkCount,
      availableArtworks,
      orderCount,
      pendingOrders,
      customerCount,
      revenue,
      completedOrders,
    ],
  );

  const surface = [
    "rounded-2xl border p-6",
    "transition-all duration-300",
    light
      ? "border-neutral-300/70 bg-[#eeece7]"
      : "border-white/5 bg-[#111113]",
  ].join(" ");

  const iconSurface = light
    ? "bg-[#e5e3de] text-neutral-600"
    : "bg-white/[0.04] text-white/70";

  const muted = light
    ? "text-neutral-500"
    : "text-white/40";

  const faint = light
    ? "text-neutral-400"
    : "text-white/30";

  const statusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return light
          ? "bg-neutral-900 text-white"
          : "bg-white/10 text-white";

      case "cancelled":
        return light
          ? "bg-red-100 text-red-700"
          : "bg-red-500/10 text-red-300";

      case "shipping":
        return light
          ? "bg-blue-100 text-blue-700"
          : "bg-blue-500/10 text-blue-300";

      case "processing":
        return light
          ? "bg-amber-100 text-amber-700"
          : "bg-amber-500/10 text-amber-300";

      default:
        return light
          ? "bg-neutral-200 text-neutral-700"
          : "bg-white/5 text-white/50";
    }
  };

  return (
    <section className="space-y-8">
      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className={[
              "mb-2 text-xs font-semibold uppercase tracking-[0.25em]",
              light ? "text-neutral-500" : "text-white/35",
            ].join(" ")}
          >
            Overview
          </p>

          <h2 className="font-serif text-3xl sm:text-4xl">
            Dashboard
          </h2>

          <p
            className={[
              "mt-2 max-w-xl text-sm",
              muted,
            ].join(" ")}
          >
            A live overview of your artworks, orders,
            customers and store activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard(true)}
          disabled={loading || refreshing}
          className={[
            "inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
            "transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-50",
            light
              ? "border-neutral-300 bg-[#e5e3de] text-neutral-700 hover:bg-[#dddcd7]"
              : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]",
          ].join(" ")}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <ErrorState
          type="network"
          title="Connection Lost"
          message={
            error ||
            "We couldn't load the dashboard data. Please check your internet connection and try again."
          }
          actionLabel="Refresh"
          onAction={() => {
            void loadDashboard(true);
          }}
        />
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <article
            key={label}
            tabIndex={0}
            className={[
              "group relative rounded-2xl border p-5",
              "transition-all duration-300",
              "outline-none",
              "hover:-translate-y-1 focus:-translate-y-1",
              light
                ? "border-neutral-300/70 bg-[#eeece7]"
                : "border-white/5 bg-[#111113]",
            ].join(" ")}
          >
            {!loading && (
              <div
                className={[
                  "pointer-events-none absolute right-4 top-4 z-10",
                  "rounded-lg border px-2.5 py-1.5",
                  "text-xs font-semibold",
                  "opacity-0 translate-y-1 scale-95",
                  "transition-all duration-200",
                  "group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100",
                  "group-focus:opacity-100 group-focus:translate-y-0 group-focus:scale-100",
                  light
                    ? "border-neutral-300 bg-white text-neutral-950 shadow-sm"
                    : "border-white/10 bg-[#18181b] text-white shadow-lg",
                ].join(" ")}
              >
                {value}
              </div>
            )}

            <div
              className={[
                "mb-5 flex h-11 w-11 items-center justify-center rounded-xl",
                iconSurface,
              ].join(" ")}
            >
              <Icon size={20} />
            </div>

            <p className={["text-sm", muted].join(" ")}>
              {label}
            </p>

            {loading ? (
              <div className="mt-3 h-9 w-28 animate-pulse rounded-lg bg-current opacity-10" />
            ) : (
              <p className="mt-2 truncate text-2xl font-semibold sm:text-3xl">
                {value}
              </p>
            )}

            <p className={["mt-2 text-xs", faint].join(" ")}>
              {loading ? "Loading..." : detail}
            </p>
          </article>
        ))}
      </div>

      {/* REVENUE + STORAGE */}

      <div className="grid gap-6 lg:grid-cols-2">

                <Storage />

      </div>

      {/* RECENT ORDERS */}

      <article className={surface}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.2em]",
                light ? "text-neutral-500" : "text-white/35",
              ].join(" ")}
            >
              Orders
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              Recent Orders
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("orders")}
            className={[
              "flex items-center gap-1 text-sm transition-colors",
              light
                ? "text-neutral-500 hover:text-neutral-950"
                : "text-white/50 hover:text-white",
            ].join(" ")}
          >
            View all
            <ArrowUpRight size={15} />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 min-w-[650px]">
            <div
              className={[
                "grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-4 border-b pb-3",
                light ? "border-neutral-300" : "border-white/5",
              ].join(" ")}
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={[
                    "h-3 rounded-md animate-pulse",
                    light ? "bg-neutral-300" : "bg-white/10",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="divide-y divide-current/5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-4 py-4"
                >
                  <div className="space-y-2">
                    <div
                      className={[
                        "h-4 w-24 rounded-md animate-pulse",
                        light ? "bg-neutral-300" : "bg-white/10",
                      ].join(" ")}
                    />
                    <div
                      className={[
                        "h-3 w-32 rounded-md animate-pulse",
                        light ? "bg-neutral-200" : "bg-white/5",
                      ].join(" ")}
                    />
                  </div>

                  <div className="space-y-2">
                    <div
                      className={[
                        "h-4 w-28 rounded-md animate-pulse",
                        light ? "bg-neutral-300" : "bg-white/10",
                      ].join(" ")}
                    />
                    <div
                      className={[
                        "h-3 w-36 rounded-md animate-pulse",
                        light ? "bg-neutral-200" : "bg-white/5",
                      ].join(" ")}
                    />
                  </div>

                  <div
                    className={[
                      "h-4 w-20 rounded-md animate-pulse",
                      light ? "bg-neutral-300" : "bg-white/10",
                    ].join(" ")}
                  />

                  <div
                    className={[
                      "h-6 w-20 rounded-full animate-pulse",
                      light ? "bg-neutral-300" : "bg-white/10",
                    ].join(" ")}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center">
            <div className="text-center">
              <ShoppingBag
                size={24}
                className={["mx-auto mb-3", faint].join(" ")}
              />
              <p className={["text-sm", faint].join(" ")}>
                No orders yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[650px]">
              <div
                className={[
                  "grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-4 border-b pb-3 text-xs uppercase tracking-wider",
                  light
                    ? "border-neutral-300 text-neutral-400"
                    : "border-white/5 text-white/30",
                ].join(" ")}
              >
                <span>Order</span>
                <span>Customer</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-current/5">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className={[
                      "grid grid-cols-[1.3fr_1.2fr_1fr_1fr] gap-4 py-4 text-sm",
                      light ? "border-neutral-200" : "border-white/5",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-medium">
                        {order.order_number || "—"}
                      </p>
                      <p className={["mt-1 text-xs", faint].join(" ")}>
                        {formatDate(order.created_at)} ·{" "}
                        {formatTime(order.created_at)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate">
                        {order.customer_name || "Customer"}
                      </p>
                      <p className={["mt-1 truncate text-xs", faint].join(" ")}>
                        {order.email || "—"}
                      </p>
                    </div>

                    <div className="font-medium">
                      {formatCurrency(Number(order.total || 0))}
                    </div>

                    <div>
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs capitalize",
                          statusClass(order.status || "pending"),
                        ].join(" ")}
                      >
                        {order.status || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>

      {/* QUICK ACTIONS */}

      <section>
        <div className="mb-5">
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.25em]",
              light ? "text-neutral-500" : "text-white/35",
            ].join(" ")}
          >
            Shortcuts
          </p>

          <h3 className="mt-2 font-serif text-2xl">
            Quick Actions
          </h3>

          <p
            className={[
              "mt-1 text-sm",
              muted,
            ].join(" ")}
          >
            Quickly access the most common admin tasks.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map(({ label, section, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => onNavigate?.(section)}
              className={[
                "group flex min-h-28 flex-col justify-between",
                "rounded-2xl border p-5 text-left",
                "transition-all duration-200",
                light
                  ? "border-neutral-300/70 bg-[#eeece7] hover:-translate-y-1 hover:border-neutral-400 hover:bg-[#e5e3de]"
                  : "border-white/5 bg-[#111113] hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  "transition-colors duration-200",
                  iconSurface,
                  light
                    ? "group-hover:bg-neutral-950 group-hover:text-white"
                    : "group-hover:bg-white group-hover:text-black",
                ].join(" ")}
              >
                <Icon size={18} />
              </span>

              <span
                className={[
                  "text-sm font-medium transition-colors",
                  light
                    ? "text-neutral-600 group-hover:text-neutral-950"
                    : "text-white/60 group-hover:text-white",
                ].join(" ")}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>

    </section>
  );
}
