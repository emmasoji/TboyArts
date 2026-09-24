import API_URL from "../../config/api";

import { useEffect, useState } from "react";
import {
  Search,
  X,
  ChevronLeft,
  PackageSearch,
  Mail,
  Hash,
  Loader2,
  CheckCircle2,
  Clock3,
  Truck,
  CircleX,
  CreditCard,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useTrackOrder } from "../../contexts/TrackOrderContext";
import { useCurrency } from "../../contexts/CurrencyContext";

type TrackingItem = {
  artwork_id: string;
  title: string | null;
  image: string | null;
  quantity: number;
};

type TrackingOrder = {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  email: string | null;
  total: number | null;
  payment_status: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  items: TrackingItem[];
};

const API_BASE_URL =
  API_URL;



function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return CheckCircle2;

    case "shipping":
    case "shipped":
      return Truck;

    case "cancelled":
      return CircleX;

    case "processing":
      return PackageSearch;

    default:
      return Clock3;
  }
}

function getTimeline(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "cancelled") {
    return [
      {
        key: "placed",
        label: "Order placed",
        description: "Your order was received.",
        complete: true,
      },
      {
        key: "cancelled",
        label: "Order cancelled",
        description: "This order has been cancelled.",
        complete: true,
      },
    ];
  }

  const stages = [
    {
      key: "placed",
      label: "Order placed",
      description: "Your order was received.",
    },
    {
      key: "processing",
      label: "Processing",
      description: "Your artwork is being prepared.",
    },
    {
      key: "shipping",
      label: "Shipping",
      description: "Your order is on its way.",
    },
    {
      key: "completed",
      label: "Completed",
      description: "Your order has been completed.",
    },
  ];

  const progressMap: Record<string, number> = {
    pending: 0,
    processing: 1,
    shipping: 2,
    shipped: 2,
    completed: 3,
  };

  const currentIndex = progressMap[normalized] ?? 0;

  return stages.map((stage, index) => ({
    ...stage,
    complete: index <= currentIndex,
  }));
}

export default function TrackOrderModal() {
  const { formatPrice } = useCurrency();
  const {
    isTrackOrderOpen,
    closeTrackOrder,
    trackOrderNumber,
    trackOrderEmail,
    setTrackOrderEmail,
  } = useTrackOrder();

  const [searchValue, setSearchValue] =
    useState("");

  const [order, setOrder] =
    useState<TrackingOrder | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!isTrackOrderOpen) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isTrackOrderOpen]);

  useEffect(() => {
    if (!isTrackOrderOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTrackOrder();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isTrackOrderOpen, closeTrackOrder]);

  useEffect(() => {
    if (!isTrackOrderOpen) {
      setSearchValue("");
      setOrder(null);
      setError("");
      setLoading(false);
      return;
    }

    if (trackOrderNumber.trim()) {
      setSearchValue(trackOrderNumber.trim().toUpperCase());
    }
  }, [isTrackOrderOpen, trackOrderNumber]);

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    const value = searchValue.trim();
    const email = trackOrderEmail.trim().toLowerCase();

    if (!value || !email || loading) {
      if (!email && value) {
        setError(
          "Please enter the email address used for this order.",
        );
      }
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const parameters = new URLSearchParams({
        order_number: value.toUpperCase(),
        email,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/tracking/order?${parameters.toString()}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "We couldn't find an order with those details."
            : data.detail ||
                "Unable to track your order right now.",
        );
      }

      if (!data.success || !data.order) {
        throw new Error(
          "Unable to retrieve your order.",
        );
      }

      setOrder(data.order);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to track your order.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTrackAnother = () => {
    setOrder(null);
    setError("");
    setSearchValue("");
    setTrackOrderEmail("");
  };

  const StatusIcon = order
    ? getStatusIcon(order.status)
    : Clock3;

  const timeline = order
    ? getTimeline(order.status)
    : [];

  return (
    <AnimatePresence>
      {isTrackOrderOpen && (
        <motion.div
          className="tracking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="tracking-modal"
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.98,
            }}
            transition={{
              duration: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-order-title"
          >
            <header className="tracking-modal-header">
              <div className="tracking-modal-heading">
                <div className="tracking-icon">
                  <PackageSearch size={22} />
                </div>

                <div>
                  <h2 id="track-order-title">
                    Track order
                  </h2>
                </div>
              </div>

              <button
                type="button"
                className="tracking-close"
                onClick={closeTrackOrder}
                aria-label="Close track order"
              >
                <X size={21} />
              </button>
            </header>

            <div className="tracking-modal-body">
              {!order ? (
                <>
                  <form
                    className="tracking-form"
                    onSubmit={handleSubmit}
                  >
                    <label htmlFor="tracking-search">
                      Order number
                    </label>

                    <div className="tracking-input-wrapper">
                      <Hash size={18} />

                      <input
                        id="tracking-search"
                        type="text"
                        value={searchValue}
                        onChange={(event) =>
                          setSearchValue(event.target.value)
                        }
                        placeholder="TB-XXXXXX"
                        autoComplete="off"
                        disabled={loading}
                      />
                    </div>

                    <label htmlFor="tracking-email">
                      Email address
                    </label>

                    <div className="tracking-input-wrapper">
                      <Mail size={18} />

                      <input
                        id="tracking-email"
                        type="email"
                        value={trackOrderEmail}
                        onChange={(event) =>
                          setTrackOrderEmail(event.target.value)
                        }
                        placeholder="customer@email.com"
                        autoComplete="email"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <motion.div
                        className="tracking-error"
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                      >
                        <CircleX size={17} />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      className="tracking-submit"
                      disabled={
                        !searchValue.trim() ||
                        !trackOrderEmail.trim() ||
                        loading
                      }
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={18}
                            className="animate-spin"
                          />
                          Finding order...
                        </>
                      ) : (
                        <>
                          <Search size={18} />
                          Find my order
                        </>
                      )}
                    </button>
                  </form>

                  <div className="tracking-help">
                    <p>
                      Your order number can be found
                      in your confirmation email.
                    </p>
                  </div>
                </>
              ) : (
                <motion.div
                  className="tracking-result"
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  {/* STATUS WATERMARK */}
                  <div
                    className="tracking-status-watermark"
                    aria-hidden="true"
                  >
                    <StatusIcon />
                  </div>

                  <div className="tracking-result-content">
                    {/* ORDER HEADER */}

                    <div className="tracking-result-top">
                      <div>
                        <p className="tracking-overline">
                          Order
                        </p>

                        <h3 className="tracking-order-number">
                          {order.order_number ||
                            "Order"}
                        </h3>

                        <p className="tracking-order-date">
                          Placed{" "}
                          {formatDate(
                            order.created_at,
                          )}
                        </p>
                      </div>

                      <div className="tracking-current-status">
                        <span>
                          {formatStatus(
                            order.status,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* TIMELINE */}

                    <div className="tracking-timeline">
                      {timeline.map(
                        (stage, index) => (
                          <div
                            key={stage.key}
                            className={[
                              "tracking-timeline-item",
                              stage.complete
                                ? "complete"
                                : "",
                              index ===
                              timeline.length - 1
                                ? "last"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <div className="tracking-timeline-marker">
                              {stage.complete ? (
                                <CheckCircle2
                                  size={17}
                                />
                              ) : (
                                <span />
                              )}
                            </div>

                            {index !==
                              timeline.length - 1 && (
                              <div className="tracking-timeline-line" />
                            )}

                            <div className="tracking-timeline-copy">
                              <strong>
                                {stage.label}
                              </strong>

                              <span>
                                {stage.description}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>

                    {/* PAYMENT */}

                    <div className="tracking-payment">
                      <div className="tracking-payment-icon">
                        <CreditCard size={18} />
                      </div>

                      <div>
                        <span>
                          Payment
                        </span>

                        <strong>
                          {formatStatus(
                            order.payment_status ||
                              "pending",
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* ARTWORK */}

                    {order.items.length > 0 && (
                      <div className="tracking-artwork-section">
                        <p className="tracking-section-label">
                          Your artwork
                        </p>

                        <div className="tracking-artwork-list">
                          {order.items.map(
                            (item) => (
                              <div
                                className="tracking-artwork"
                                key={
                                  item.artwork_id
                                }
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={
                                      item.title ||
                                      "Artwork"
                                    }
                                  />
                                ) : (
                                  <div className="tracking-artwork-placeholder">
                                    <PaletteIcon />
                                  </div>
                                )}

                                <div>
                                  <strong>
                                    {item.title ||
                                      "Artwork"}
                                  </strong>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* TOTAL */}

                    <div className="tracking-total">
                      <span>Order total</span>

                      <strong>
                        {order.total === null
                            ? "Price unavailable"
                            : formatPrice(order.total)}
                      </strong>
                    </div>

                    {/* ACTION */}

                    <button
                      type="button"
                      className="tracking-submit"
                      onClick={handleTrackAnother}
                    >
                      <ChevronLeft size={18} />
                      Back
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PaletteIcon() {
  return <PackageSearch size={20} />;
}
