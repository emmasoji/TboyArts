import {
  ChevronLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loadCheckout } from "../../loaders/checkoutLoader";
import { useCart } from "../../contexts/CartContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useTheme } from "../../contexts/ThemeContext";


export default function CartModal() {
  const { theme } = useTheme();
  const { formatPrice } = useCurrency();
  const {
    items,
    cartOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const light = theme === "light";
  const navigate = useNavigate();

  if (!cartOpen) {
    return null;
  }
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <>
      <style>{`
        @keyframes cartModalOpen {
          from {
            opacity: 0;
            transform: translateY(-32px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cartContentDrop {
          from {
            opacity: 0;
            transform: translateY(-22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tboyarts-cart-backdrop {
          animation: cartBackdropIn 300ms ease-out;
        }

        .tboyarts-cart-modal {
          animation: cartModalOpen 450ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tboyarts-cart-content {
          animation: cartContentDrop 550ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cartBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>

      <div
      className={[
        "fixed inset-0 z-[10000] flex",
        "tboyarts-cart-backdrop",
        "bg-black/45 backdrop-blur-md",
        "sm:items-center sm:justify-center sm:p-4",
      ].join(" ")}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeCart();
        }
      }}
    >
      <div
        className={[
          "relative flex h-full w-full flex-col overflow-hidden shadow-2xl",
          "tboyarts-cart-modal",
          "sm:h-[min(90vh,760px)] sm:max-w-4xl sm:rounded-2xl",
          light
            ? "bg-[#f7f6f2] text-neutral-950"
            : "bg-neutral-950 text-white",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
      >
        {/* =================================================
            CART NAVBAR
            ================================================= */}

        <header
          className={[
            "relative flex h-16 shrink-0 items-center",
            "tboyarts-cart-content",
            "border-b px-4 sm:px-6",
            light ? "border-black/10" : "border-white/10",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className={[
              "flex h-11 w-11 items-center justify-center rounded-full",
              "border transition-colors",
              light
                ? "border-black/10 bg-black/[0.06] text-neutral-700 hover:bg-black/[0.12] hover:text-black"
                : "border-white/10 bg-white/[0.08] text-neutral-300 hover:bg-white/[0.14] hover:text-white",
            ].join(" ")}
          >
            <ChevronLeft size={27} strokeWidth={1.8} />
          </button>
        </header>

        {/* =================================================
            CART CONTENT
            ================================================= */}

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag
              size={42}
              strokeWidth={1.2}
              className={light ? "text-neutral-300" : "text-white/20"}
            />

            <h3 className="mt-6 font-serif text-2xl">
              Your cart is empty
            </h3>



          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto tboyarts-cart-content">
              <div className="divide-y">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className={[
                      "flex gap-4 px-5 py-5 sm:px-7",
                      light ? "divide-black/10" : "divide-white/10",
                    ].join(" ")}
                  >
                    {/* Artwork image */}

                    <div
                      className={[
                        "h-24 w-20 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-24",
                        light ? "bg-neutral-100" : "bg-neutral-900",
                      ].join(" ")}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Details */}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-medium sm:text-base">
                            {item.title}
                          </h3>

                          {item.category && (
                            <p
                              className={[
                                "mt-1 text-[10px] uppercase tracking-[0.16em]",
                                light
                                  ? "text-neutral-400"
                                  : "text-white/30",
                              ].join(" ")}
                            >
                              {item.category}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.title} from cart`}
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            light
                              ? "text-neutral-400 hover:bg-black/5 hover:text-red-600"
                              : "text-white/35 hover:bg-white/5 hover:text-red-400",
                          ].join(" ")}
                        >
                          <Trash2 size={17} strokeWidth={1.8} />
                        </button>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4">
                        {/* Quantity */}

                        <div
                          className={[
                            "flex items-center rounded-full border",
                            light
                              ? "border-black/10"
                              : "border-white/10",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            aria-label={`Decrease quantity of ${item.title}`}
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-full",
                              light
                                ? "text-neutral-600 hover:bg-black/5"
                                : "text-white/60 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <Minus size={14} strokeWidth={2} />
                          </button>

                          <span className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            aria-label={`Increase quantity of ${item.title}`}
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-full",
                              light
                                ? "text-neutral-600 hover:bg-black/5"
                                : "text-white/60 hover:bg-white/5",
                            ].join(" ")}
                          >
                            <Plus size={14} strokeWidth={2} />
                          </button>
                        </div>

                        {/* Price */}

                        <strong className="text-sm font-medium sm:text-base">
                          {formatPrice(item.price * item.quantity)}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* =================================================
                CART SUMMARY
                ================================================= */}

            <footer
              className={[
                "shrink-0 border-t px-5 py-5 sm:px-7 sm:py-6",
                light ? "border-black/10" : "border-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span
                  className={[
                    "text-xs uppercase tracking-[0.18em]",
                    light ? "text-neutral-500" : "text-white/40",
                  ].join(" ")}
                >
                  Subtotal
                </span>

                <strong className="text-xl font-medium">
                  {formatPrice(subtotal)}
                </strong>
              </div>

              <button
                type="button"
                className={[
                  "mt-5 flex h-14 w-full items-center justify-center",
                  "rounded-full text-sm font-medium",
                  light
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-950",
                ].join(" ")}
                onClick={() => {
                  void loadCheckout();
                  closeCart();
                  navigate("/checkout");
                }}
              >
                Proceed to checkout
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
    </>
  );
}
