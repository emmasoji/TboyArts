import {
  ChevronLeft,
  ShoppingBag,
  Check,
  Eye,
} from "lucide-react";

import type { Artwork } from "../../types/artwork";
import { isPurchasable } from "../../data/artworkUtils";
import { useCart } from "../../contexts/CartContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import AddToCartAnimation from "../cart/AddToCartAnimation";
import { useTheme } from "../../contexts/ThemeContext";

interface ArtworkModalProps {
  artwork: Artwork | null;
  onClose: () => void;
  onAddToCart?: (artwork: Artwork) => void;
  onOpenCart?: () => void;
}

const modalAnimationStyles = `
@keyframes modalOpen {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes contentDrop {
  from {
    opacity: 0;
    transform: translateY(-28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

export default function ArtworkModal({
  artwork,
  onClose,
  onAddToCart,
}: ArtworkModalProps) {
  const { theme } = useTheme();
  const { itemCount, openCart } = useCart();
  const { formatPrice } = useCurrency();

  const light = theme === "light";

  if (!artwork) {
    return null;
  }

  const purchasable = isPurchasable(artwork);

  const handleBackdropClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style>{modalAnimationStyles}</style>

      <div
      className={[
        "fixed inset-0 z-[9999] flex p-0 backdrop-blur-md",
        "transition-opacity duration-300 ease-out",
        "sm:items-center sm:justify-center sm:p-4",
        light ? "bg-black/45" : "bg-black/70",
      ].join(" ")}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <AddToCartAnimation />

      <div
        className={[
          "relative flex h-full w-full flex-col overflow-hidden shadow-2xl",
          "animate-[modalOpen_450ms_cubic-bezier(0.16,1,0.3,1)]",
          "sm:h-[min(92vh,900px)] sm:max-w-6xl sm:rounded-2xl",
          light
            ? "bg-[#f7f6f2] text-neutral-950"
            : "bg-neutral-950 text-white",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artwork-modal-title"
      >
        {/* =================================================
            MODAL NAVBAR
            ================================================= */}

        <header
          className={[
            "relative z-20 flex h-16 shrink-0 items-center justify-between",
            "animate-[contentDrop_500ms_cubic-bezier(0.16,1,0.3,1)]",
            "border-b px-4 backdrop-blur-xl sm:px-6",
            light
              ? "border-black/10 bg-[#f7f6f2]/95"
              : "border-white/10 bg-neutral-950/95",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close artwork details"
            className={[
              "flex h-10 w-10 items-center justify-center rounded-full",
              "transition-colors",
              light
                ? "text-neutral-700 hover:bg-black/5 hover:text-black"
                : "text-neutral-300 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            data-tboyarts-cart-target
            onClick={openCart}
            aria-label={`Open shopping cart, ${itemCount} ${
              itemCount === 1 ? "item" : "items"
            }`}
            className={[
              "relative flex h-10 w-10 items-center justify-center",
              "rounded-full border transition-all duration-200",
              "hover:scale-[1.03]",
              light
                ? "border-black/10 bg-black/[0.04] text-neutral-900 hover:bg-black/[0.08]"
                : "border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.12]",
            ].join(" ")}
          >
            <ShoppingBag size={20} strokeWidth={1.8} />

            {itemCount > 0 && (
              <span
                className={[
                  "absolute -right-1 -top-1",
                  "flex min-h-[17px] min-w-[17px] items-center justify-center",
                  "rounded-full px-1",
                  "text-[9px] font-bold leading-none",
                  "tboyarts-cart-badge-receive",
                  light
                    ? "bg-neutral-950 text-white"
                    : "bg-white text-neutral-950",
                ].join(" ")}
              >
                {itemCount}
              </span>
            )}
          </button>
        </header>

        {/* =================================================
            SCROLLABLE CONTENT
            ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto animate-[contentDrop_650ms_cubic-bezier(0.16,1,0.3,1)]">
          <div className="grid min-h-full lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">

            {/* =================================================
                ARTWORK
                ================================================= */}

            <div
              className={[
                "relative flex min-h-[55vh] items-center justify-center",
                "overflow-hidden px-4 py-6 sm:px-8 sm:py-10 lg:min-h-full lg:px-12",
                light ? "bg-neutral-100" : "bg-neutral-900",
              ].join(" ")}
            >
              <img
                src={artwork.image}
                alt={artwork.title}
                className="max-h-[70vh] w-auto max-w-full object-contain sm:max-h-[75vh] lg:max-h-[calc(92vh-8rem)]"
              />

              {artwork.status !== "available" && (
                <div
                  className={[
                    "absolute left-6 top-6 inline-flex items-center gap-2",
                    "rounded-full px-3 py-2",
                    "text-[10px] font-semibold uppercase tracking-[0.18em]",
                    "backdrop-blur-md",
                    artwork.status === "sold"
                      ? "bg-black/80 text-white"
                      : light
                        ? "bg-white/85 text-neutral-900"
                        : "bg-neutral-900/85 text-white",
                  ].join(" ")}
                >
                  {artwork.status === "sold" ? (
                    <>
                      <Check size={14} strokeWidth={2} />
                      Sold
                    </>
                  ) : (
                    <>
                      <Eye size={14} strokeWidth={2} />
                      View Only
                    </>
                  )}
                </div>
              )}
            </div>

            {/* =================================================
                ARTWORK INFORMATION
                ================================================= */}

            <div
              className={[
                "flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12",
                light ? "bg-[#f7f6f2]" : "bg-neutral-950",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center justify-between gap-4 border-b pb-5",
                  light ? "border-black/10" : "border-white/10",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[10px] font-semibold uppercase tracking-[0.22em]",
                    light ? "text-neutral-500" : "text-white/40",
                  ].join(" ")}
                >
                  {artwork.category || "Original Artwork"}
                </span>

                <span
                  className={[
                    "text-[10px] font-semibold uppercase tracking-[0.22em]",
                    light ? "text-neutral-500" : "text-white/40",
                  ].join(" ")}
                >
                  {artwork.year}
                </span>
              </div>

              <div className="pt-7">
                <h2
                  id="artwork-modal-title"
                  className="max-w-xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl"
                >
                  {artwork.title}
                </h2>

                <p
                  className={[
                    "mt-5 max-w-xl text-sm leading-7",
                    light ? "text-neutral-600" : "text-white/55",
                  ].join(" ")}
                >
                  {artwork.description}
                </p>
              </div>

              <div
                className={[
                  "mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y py-7",
                  light ? "border-black/10" : "border-white/10",
                ].join(" ")}
              >
                <div>
                  <span
                    className={[
                      "block text-[9px] font-semibold uppercase tracking-[0.2em]",
                      light ? "text-neutral-400" : "text-white/30",
                    ].join(" ")}
                  >
                    Dimensions
                  </span>

                  <strong className="mt-2 block text-sm font-medium">
                    {artwork.dimensions}
                  </strong>
                </div>

                <div>
                  <span
                    className={[
                      "block text-[9px] font-semibold uppercase tracking-[0.2em]",
                      light ? "text-neutral-400" : "text-white/30",
                    ].join(" ")}
                  >
                    Year
                  </span>

                  <strong className="mt-2 block text-sm font-medium">
                    {artwork.year}
                  </strong>
                </div>

                <div>
                  <span
                    className={[
                      "block text-[9px] font-semibold uppercase tracking-[0.2em]",
                      light ? "text-neutral-400" : "text-white/30",
                    ].join(" ")}
                  >
                    Availability
                  </span>

                  <strong className="mt-2 block text-sm font-medium">
                    {artwork.status === "available"
                      ? "Available"
                      : artwork.status === "sold"
                        ? "Sold"
                        : "View Only"}
                  </strong>
                </div>
              </div>

              <div className="mt-auto pt-10">
                <span
                  className={[
                    "block text-[9px] font-semibold uppercase tracking-[0.2em]",
                    light ? "text-neutral-400" : "text-white/30",
                  ].join(" ")}
                >
                  Price
                </span>

                <strong className="mt-2 block text-3xl font-medium tracking-tight sm:text-4xl">
                  {formatPrice(artwork.price)}
                </strong>

                {purchasable ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      const rect =
                        event.currentTarget.getBoundingClientRect();

                      window.dispatchEvent(
                        new CustomEvent("tboyarts:add-to-cart", {
                          detail: {
                            image: artwork.image,
                            startX: rect.left + rect.width / 2,
                            startY: rect.top + rect.height / 2,
                            width: Math.min(rect.width * 0.38, 120),
                            height: Math.min(rect.width * 0.38, 120),
                          },
                        }),
                      );

                      onAddToCart?.(artwork);
                    }}
                    className={[
                      "mt-7 flex h-14 w-full items-center justify-center gap-3",
                      "rounded-full px-6 text-sm font-medium",
                      "transition-transform hover:scale-[1.01] active:scale-[0.99]",
                      light
                        ? "bg-neutral-950 text-white"
                        : "bg-white text-neutral-950",
                    ].join(" ")}
                  >
                    <ShoppingBag size={19} strokeWidth={1.9} />
                    Add to cart
                  </button>
                ) : (
                  <div
                    className={[
                      "mt-7 flex min-h-14 items-center justify-center rounded-full",
                      "border px-6 text-sm font-medium",
                      light
                        ? "border-black/10 text-neutral-500"
                        : "border-white/10 text-white/45",
                    ].join(" ")}
                  >
                    {artwork.status === "sold"
                      ? "Artwork sold"
                      : "Not available for purchase"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
