import { ArrowUpRight, ShoppingBag } from "lucide-react";
import type { Artwork } from "../../types/artwork";
import { useCurrency } from "../../contexts/CurrencyContext";
import { isPurchasable } from "../../data/artworkUtils";

interface ArtworkCardProps {
  artwork: Artwork;

  // Opens the detailed artwork modal
  onSelect?: (artwork: Artwork) => void;

  // Opens the image-only preview modal
  onImageSelect?: (artwork: Artwork) => void;
}

export default function ArtworkCard({
  artwork,
  onSelect,
  onImageSelect,
}: ArtworkCardProps) {
  const { formatPrice } = useCurrency();
  const purchasable = isPurchasable(artwork);

  return (
    <article className="artwork-card">

      {/* =====================================================
          IMAGE
          This ONLY opens the image preview modal
          ===================================================== */}

      <button
        type="button"
        className="artwork-card-image-button"
        onClick={() => onImageSelect?.(artwork)}
        aria-label={`Preview ${artwork.title}`}
      >
        <div className="artwork-card-image-wrapper">

          <img
            src={artwork.image}
            alt={artwork.title}
            className="artwork-card-image"
            loading="lazy"
          />

          {artwork.status !== "available" && (
            <span
              className={`artwork-status-badge ${artwork.status}`}
            >
              {artwork.status === "sold"
                ? "Sold"
                : "View Only"}
            </span>
          )}

          {artwork.newArrival && (
            <span className="artwork-new-badge">
              New
            </span>
          )}

        </div>
      </button>


      {/* =====================================================
          ARTWORK INFORMATION
          ===================================================== */}

      <div className="artwork-card-info">

        <div className="artwork-card-heading">

          <div>
            <h3>{artwork.title}</h3>

            {artwork.category && (
              <p>{artwork.category}</p>
            )}
          </div>

          {/* This opens the DETAILED artwork modal */}

          <button
            type="button"
            className="artwork-card-arrow"
            onClick={() => onSelect?.(artwork)}
            aria-label={`View details for ${artwork.title}`}
          >
            <ArrowUpRight size={18} />
          </button>

        </div>


        <div className="artwork-card-meta">

          <span>
            {artwork.dimensions}
          </span>

          {purchasable ? (
            <span className="artwork-price">
              {formatPrice(artwork.price)}
            </span>
          ) : (
            <span className="artwork-unavailable">
              {artwork.status === "sold"
                ? "Sold"
                : "View only"}
            </span>
          )}

        </div>


        {/* This also opens the DETAILED artwork modal */}

        {purchasable && (
          <button
            type="button"
            className="artwork-add-button"
            onClick={() => onSelect?.(artwork)}
          >
            <ShoppingBag size={16} />
            View artwork
          </button>
        )}

      </div>

    </article>
  );
}