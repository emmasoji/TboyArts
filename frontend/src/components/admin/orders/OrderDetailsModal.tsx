import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { Order } from "../../../services/orderService";
import ErrorState from "../../errors/ErrorState";

interface OrderDetailsModalProps {
  order: Order;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClose: () => void;
}

function formatMoney(value: number | null) {
  return `₦${Number(value ?? 0).toLocaleString()}`;
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-[var(--admin-text-faint)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-[var(--admin-text-muted)]">
        {value || "—"}
      </p>
    </div>
  );
}

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--admin-surface-muted)] ${className}`}
    />
  );
}

function OrderDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* PURCHASED */}
      <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-32" />
          </div>

          <SkeletonBlock className="h-10 w-20 rounded-xl" />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <SkeletonBlock className="h-20 w-20 shrink-0 rounded-xl" />

          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-4 w-48 max-w-full" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
      </section>

      {/* CUSTOMER */}
      <section>
        <SkeletonBlock className="mb-5 h-3 w-20" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full sm:col-span-2" />
        </div>
      </section>

      {/* PAYMENT */}
      <section className="border-t border-[var(--admin-border)] pt-7">
        <SkeletonBlock className="mb-5 h-3 w-20" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </section>

      {/* ORDER SUMMARY */}
      <section className="border-t border-[var(--admin-border)] pt-7">
        <SkeletonBlock className="mb-5 h-3 w-28" />

        <div className="max-w-xl space-y-5">
          <div className="flex justify-between gap-8">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-28" />
          </div>

          <div className="flex justify-between gap-8">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-24" />
          </div>

          <div className="border-t border-[var(--admin-border)] pt-4">
            <div className="flex justify-between gap-8">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-6 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="border-t border-[var(--admin-border)] pt-7">
        <SkeletonBlock className="mb-4 h-3 w-12" />
        <div className="space-y-3 max-w-3xl">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-5/6" />
          <SkeletonBlock className="h-3 w-2/3" />
        </div>
      </section>

      {/* DATE */}
      <section className="border-t border-[var(--admin-border)] pt-7 pb-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </section>

    </div>
  );
}

export default function OrderDetailsModal({
  order,
  loading = false,
  error = null,
  onRetry,
  onClose,
}: OrderDetailsModalProps) {
  const [purchasedOpen, setPurchasedOpen] =
    useState(false);

  const items = order.items ?? [];
  const hasMultipleItems = items.length > 1;

  return createPortal(
    <div className="admin-modal-portal fixed inset-0 z-[120]">

      {/* BACKDROP */}
      <div
        className="
          absolute
          inset-0
          bg-black/60
          backdrop-blur-sm
          animate-[orderDetailsBackdrop_300ms_ease-out]
        "
        onClick={onClose}
      />

      {/* FULL SCREEN MODAL */}
      <div
        className="
          relative
          z-10
          flex
          h-full
          w-full
          flex-col
          overflow-hidden
          border
          border-[var(--admin-border)]
          bg-[var(--admin-surface)]
          text-[var(--admin-text)]
          shadow-2xl
          animate-[orderDetailsOpen_550ms_cubic-bezier(0.16,1,0.3,1)]
        "
      >

        {/* HEADER */}
        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-[var(--admin-border)]
            bg-[var(--admin-surface)]
            px-5
            py-4
            sm:px-8
            sm:py-5
          "
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
              Order Details
            </p>

            <h2 className="mt-1 text-xl font-medium sm:text-2xl">
              {order.order_number || "Order"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close order details"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[var(--admin-surface-soft)]
              text-[var(--admin-text-muted)]
              transition
              hover:opacity-80
            "
          >
            <X size={19} />
          </button>
        </div>

        {/* CONTENT */}
        <div
          className="
            flex-1
            overflow-y-auto
            px-5
            py-6
            sm:px-8
            sm:py-8
            lg:px-12
          "
        >
          {loading ? (
            <OrderDetailsSkeleton />
          ) : error ? (
            <ErrorState
              type="server"
              title="Unable to Load Order Details"
              message={
                error ||
                "We couldn't load the order details right now. Please try again."
              }
              actionLabel="Try Again"
              onAction={() => {
                onRetry?.();
              }}
            />
          ) : (
            <div className="mx-auto max-w-6xl space-y-8">

            {/* PURCHASED */}
            <section
              className="
                rounded-2xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface-soft)]
                p-5
                sm:p-6
              "
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                    Purchased
                  </p>

                  <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
                    {items.length === 0
                      ? "No purchased items found."
                      : `${items.length} ${
                          items.length === 1
                            ? "product"
                            : "products"
                        }`}
                  </p>
                </div>

                {hasMultipleItems && (
                  <button
                    type="button"
                    onClick={() =>
                      setPurchasedOpen(
                        (open) => !open,
                      )
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-[var(--admin-surface-muted)]
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-[var(--admin-text)]
                      transition
                      hover:opacity-80
                    "
                  >
                    {purchasedOpen
                      ? "Hide"
                      : "View"}

                    <ChevronDown
                      size={16}
                      className={
                        purchasedOpen
                          ? "rotate-180 transition-transform"
                          : "transition-transform"
                      }
                    />
                  </button>
                )}
              </div>

              {/* SINGLE PRODUCT */}
              {items.length === 1 && (
                <div className="mt-5 flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)]">
                    {items[0].image ? (
                      <img
                        src={items[0].image}
                        alt={
                          items[0].title ??
                          "Purchased artwork"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--admin-text-faint)]">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-[var(--admin-text)]">
                      {items[0].title ||
                        "Untitled Artwork"}
                    </p>

                    <p className="mt-1 text-xs text-[var(--admin-text-faint)]">
                      Quantity:{" "}
                      {items[0].quantity}
                    </p>
                  </div>
                </div>
              )}

              {/* MULTIPLE PRODUCTS */}
              {hasMultipleItems &&
                purchasedOpen && (
                  <div className="mt-5 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.artwork_id}
                        className="
                          flex
                          items-center
                          gap-4
                          rounded-xl
                          border
                          border-[var(--admin-border)]
                          bg-[var(--admin-surface)]
                          p-3
                        "
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--admin-input)]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={
                                item.title ??
                                "Purchased artwork"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--admin-text-faint)]">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                            {item.title ||
                              "Untitled Artwork"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--admin-text-faint)]">
                            Quantity:{" "}
                            {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </section>

            {/* CUSTOMER */}
            <section>
              <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                Customer
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Detail
                  label="Customer"
                  value={
                    order.customer ??
                    "Guest Customer"
                  }
                />

                <Detail
                  label="Email"
                  value={order.email ?? "—"}
                />

                <Detail
                  label="Phone"
                  value={order.phone ?? "—"}
                />

                <Detail
                  label="Country"
                  value={order.country ?? "—"}
                />

                <Detail
                  label="City"
                  value={order.city ?? "—"}
                />

                <div className="sm:col-span-2">
                  <Detail
                    label="Address"
                    value={order.address ?? "—"}
                  />
                </div>
              </div>
            </section>

            {/* PAYMENT */}
            <section className="border-t border-[var(--admin-border)] pt-7">
              <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                Payment
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Detail
                  label="Payment Method"
                  value={
                    order.payment_method ?? "—"
                  }
                />

                <Detail
                  label="Payment Status"
                  value={
                    order.payment_status ?? "—"
                  }
                />

                <Detail
                  label="Payment Reference"
                  value={
                    order.payment_reference ?? "—"
                  }
                />

                <Detail
                  label="Bank Reference"
                  value={
                    order.bank_reference ?? "—"
                  }
                />
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <section className="border-t border-[var(--admin-border)] pt-7">
              <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                Order Summary
              </p>

              <div className="max-w-xl space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">
                    Subtotal
                  </span>

                  <span className="text-[var(--admin-text)]">
                    {formatMoney(
                      order.subtotal,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">
                    Shipping
                  </span>

                  <span className="text-[var(--admin-text)]">
                    {formatMoney(
                      order.shipping,
                    )}
                  </span>
                </div>

                <div className="border-t border-[var(--admin-border)] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium">
                      Total
                    </span>

                    <span className="text-xl font-semibold">
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* NOTE */}
            {order.note && (
              <section className="border-t border-[var(--admin-border)] pt-7">
                <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--admin-text-faint)]">
                  Note
                </p>

                <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-[var(--admin-text-muted)]">
                  {order.note}
                </p>
              </section>
            )}

            {/* DATE */}
            <section className="border-t border-[var(--admin-border)] pt-7 pb-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <Detail
                  label="Created"
                  value={new Date(
                    order.created_at,
                  ).toLocaleString()}
                />

                <Detail
                  label="Last Updated"
                  value={new Date(
                    order.updated_at,
                  ).toLocaleString()}
                />
              </div>
            </section>

            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes orderDetailsSkeleton {
            0%, 100% {
              opacity: 0.45;
            }

            50% {
              opacity: 0.9;
            }
          }

          .animate-pulse {
            animation: orderDetailsSkeleton 1.6s ease-in-out infinite;
          }

          @keyframes orderDetailsBackdrop {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes orderDetailsOpen {
            from {
              opacity: 0;
              transform: translateY(50px) scale(0.98);
            }

            60% {
              opacity: 1;
              transform: translateY(-4px) scale(1);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .admin-modal-portal * {
              animation: none !important;
              transition: none !important;
            }
          }
        `}
      </style>
    </div>,
    document.body,
  );
}
