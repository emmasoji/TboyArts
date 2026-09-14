import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  DollarSign,
  Clock3,
  CircleCheck,
  CircleSlash,
  ChevronDown,
} from "lucide-react";

import {
  deleteOrder,
  getOrder,
  getOrders,
  updateOrderStatus,
} from "../../../services/orderService";

import type {
  Order,
  OrderStatus,
} from "../../../services/orderService";

import OrdersTable from "./OrdersTable";
import OrderActionsModal from "./OrderActionsModal";
import UpdateOrderStatusModal from "./UpdateOrderStatusModal";
import OrderDetailsModal from "./OrderDetailsModal";
import DeleteOrderModal from "./DeleteOrderModal";

type OrderFilter =
  | "all"
  | "paid"
  | "pending"
  | "cancelled";

export default function Orders() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [loadingOrderDetails, setLoadingOrderDetails] =
    useState(false);

  const [orderDetailsError, setOrderDetailsError] =
    useState<string | null>(null);

  const [showStatus, setShowStatus] =
    useState(false);

  const [showDelete, setShowDelete] =
    useState(false);

  const [orderFilter, setOrderFilter] =
    useState<OrderFilter>("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);

      const data = await getOrders();

      setOrders(data);
    } catch (err) {
      console.error(
        "Failed to load orders:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load orders.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadOrderDetails(
    orderId: string,
  ) {
    try {
      setLoadingOrderDetails(true);
      setOrderDetailsError(null);

      const fullOrder = await getOrder(orderId);

      setSelectedOrder(fullOrder);
    } catch (err) {
      console.error(
        "Failed to load order details:",
        err,
      );

      setOrderDetailsError(
        err instanceof Error
          ? err.message
          : "We couldn't load the order details. Please try again.",
      );
    } finally {
      setLoadingOrderDetails(false);
    }
  }

  function closeAllModals() {
    setSelectedOrder(null);
    setShowDetails(false);
    setShowStatus(false);
    setShowDelete(false);
    setOrderDetailsError(null);
  }

  async function handleStatusUpdate(
    status: OrderStatus,
  ) {
    if (!selectedOrder) return;

    const updated =
      await updateOrderStatus(
        selectedOrder.id,
        status,
      );

    setOrders((current) =>
      current.map((order) =>
        order.id === updated.id
          ? updated
          : order,
      ),
    );

    setSelectedOrder(updated);
  }

  async function handleDeleteOrder() {
    if (!selectedOrder) return;

    const id = selectedOrder.id;

    await deleteOrder(id);

    setOrders((current) =>
      current.filter(
        (order) => order.id !== id,
      ),
    );

    closeAllModals();
  }

  /*
   * STATISTICS
   */

  const revenue = orders
    .filter(
      (order) =>
        order.status === "completed",
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total ?? 0),
      0,
    );

  const pending = orders.filter(
    (order) =>
      order.status === "pending",
  ).length;

  const completed = orders.filter(
    (order) =>
      order.status === "completed",
  ).length;

  const cancelled = orders.filter(
    (order) =>
      order.status === "cancelled",
  ).length;

  /*
   * ORDER FILTER
   */

  const filteredOrders =
    orders.filter((order) => {
      if (orderFilter === "all") {
        return true;
      }

      if (orderFilter === "paid") {
        return (
          String(
            order.payment_status ?? "",
          )
            .trim()
            .toLowerCase() === "paid"
        );
      }

      if (orderFilter === "pending") {
        return (
          order.status === "pending"
        );
      }

      if (orderFilter === "cancelled") {
        return (
          order.status === "cancelled"
        );
      }

      return true;
    });

  return (
    <section className="space-y-8">

      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Management
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl">
          Orders
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage customer purchases and deliveries.
        </p>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`order-stat-skeleton-${index}`}
              className="
                rounded-2xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface)]
                p-5
              "
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-soft)]" />

                  <div className="mt-4 h-7 w-24 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                </div>

                <div className="h-10 w-10 animate-pulse rounded-xl bg-[var(--admin-surface-soft)]" />
              </div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={<DollarSign size={19} />}
              label="Revenue"
              value={`₦${revenue.toLocaleString()}`}
            />

            <StatCard
              icon={<Clock3 size={19} />}
              label="Pending"
              value={pending.toString()}
            />

            <StatCard
              icon={<CircleCheck size={19} />}
              label="Completed"
              value={completed.toString()}
            />

            <StatCard
              icon={<CircleSlash size={19} />}
              label="Cancelled"
              value={cancelled.toString()}
            />
          </>
        )}

      </div>

      {/* ORDER FILTER */}

      <div className="flex items-center justify-between gap-4">

        <div>
          <p className="text-sm font-medium text-white/70">
            Orders
          </p>

          <p className="mt-1 text-xs text-[var(--admin-text-faint)]">
            Showing {filteredOrders.length}{" "}
            {filteredOrders.length === 1
              ? "order"
              : "orders"}
          </p>
        </div>

        <div className="relative w-48 sm:w-56">

          <select
            value={orderFilter}
            onChange={(event) =>
              setOrderFilter(
                event.target
                  .value as OrderFilter,
              )
            }
            className="
              w-full
              appearance-none
              rounded-xl
              border
              border-[var(--admin-border)]
              bg-[var(--admin-surface)]
              px-4
              py-3
              pr-10
              text-sm
              text-white
              outline-none
              transition
              focus:border-white/30
            "
          >
            <option value="all">
              All Orders
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-[var(--admin-text-faint)]
            "
          />

        </div>

      </div>

      {/* TABLE */}

      <OrdersTable
        orders={filteredOrders}
        loading={loading}
        error={error}
        onOrderClick={(order) => {
          setSelectedOrder(order);
        }}
      />

      {/* ACTION MENU */}

      {selectedOrder &&
        !showDetails &&
        !showStatus &&
        !showDelete &&
        createPortal(
          <OrderActionsModal
            order={selectedOrder}
            onClose={() =>
              setSelectedOrder(null)
            }
            onView={async () => {
              setShowDetails(true);
              void loadOrderDetails(
                selectedOrder.id,
              );
            }}
            onUpdateStatus={() =>
              setShowStatus(true)
            }
            onCancel={async () => {
              await handleStatusUpdate(
                "cancelled",
              );

              closeAllModals();
            }}
            onDelete={() =>
              setShowDelete(true)
            }
          />,
          document.body,
        )}

      {/* VIEW */}

      {selectedOrder &&
        showDetails && (
          <OrderDetailsModal
            order={selectedOrder}
            loading={loadingOrderDetails}
            error={orderDetailsError}
            onRetry={() => {
              void loadOrderDetails(
                selectedOrder.id,
              );
            }}
            onClose={closeAllModals}
          />
        )}

      {/* STATUS */}

      {selectedOrder &&
        showStatus && (
          <UpdateOrderStatusModal
            order={selectedOrder}
            onClose={() =>
              setShowStatus(false)
            }
            onUpdate={
              handleStatusUpdate
            }
          />
        )}

      {/* DELETE */}

      {selectedOrder &&
        showDelete && (
          <DeleteOrderModal
            order={selectedOrder}
            onClose={() =>
              setShowDelete(false)
            }
            onConfirm={
              handleDeleteOrder
            }
          />
        )}

    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5">

      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-surface)] text-[var(--admin-text-muted)]">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-wider text-[var(--admin-text-faint)]">
        {label}
      </p>

      <p className="mt-1 text-xl font-medium">
        {value}
      </p>

    </div>
  );
}
