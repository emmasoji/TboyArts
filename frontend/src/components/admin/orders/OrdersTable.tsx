
import type { Order } from "../../../services/orderService";

import ErrorState from "../../errors/ErrorState";
import OrderRow from "./OrderRow";

interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  error?: string | null;
  onOrderClick: (order: Order) => void;
}

export default function OrdersTable({
  orders,
  loading = false,
  error = null,
  onOrderClick,
}: OrdersTableProps) {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[var(--admin-border)]
        bg-[var(--admin-surface)]
      "
    >
      <div className="max-h-[600px] overflow-auto">

        <table
          className="
            w-full
            min-w-[850px]
            border-separate
            border-spacing-0
          "
        >

          <thead>
            <tr className="text-left">

              <th
                className="
                  sticky
                  top-0
                  z-20
                  w-16
                  border-b
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-5
                  py-4
                "
              />

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-[var(--admin-text-muted)]
                "
              >
                Order
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-[var(--admin-text-muted)]
                "
              >
                Customer
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-[var(--admin-text-muted)]
                "
              >
                Total
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-[var(--admin-text-muted)]
                "
              >
                Status
              </th>

              <th
                className="
                  sticky
                  right-0
                  top-0
                  z-30
                  w-16
                  border-b
                  border-l
                  border-[var(--admin-border)]
                  bg-[var(--admin-surface)]
                  px-4
                  py-4
                "
              />

            </tr>
          </thead>

          <tbody>

            {/* LOADING SKELETON */}

            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={`order-skeleton-${index}`}>
                  <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--admin-surface-soft)]" />
                  </td>

                  <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                  </td>

                  <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                    <div className="h-4 w-32 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                  </td>

                  <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                    <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                  </td>

                  <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                    <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--admin-surface-soft)]" />
                  </td>

                  <td className="sticky right-0 z-10 border-b border-l border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-lg bg-[var(--admin-surface-soft)]" />
                  </td>
                </tr>
              ))}

            {/* ERROR */}

            {!loading && error && (
              <tr>
                <td
                  colSpan={6}
                  className="p-0"
                >
                  <ErrorState
                    type="network"
                    title="Unable to Load Orders"
                    message={
                      error ||
                      "We couldn't load the orders right now. Please check your internet connection and try again."
                    }
                    actionLabel="Refresh"
                    onAction={() => {
                      window.location.reload();
                    }}
                  />
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              orders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-20 text-center"
                  >
                    <p className="text-sm text-white/40">
                      No orders yet.
                    </p>
                  </td>
                </tr>
              )}

            {/* ORDERS */}

            {!loading &&
              !error &&
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onClick={onOrderClick}
                />
              ))}

          </tbody>

        </table>

      </div>
    </div>
  );
}
