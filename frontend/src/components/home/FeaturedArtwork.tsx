import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

import Skeleton from "../ui/Skeleton";

import {
  getArtworks,
  type Artwork as SupabaseArtwork,
} from "../../services/artworkService";


interface FeaturedArtworkProps {
  onError?: (message: string) => void;
}

export default function FeaturedArtwork({
  onError,
}: FeaturedArtworkProps) {
  const [artworks, setArtworks] = useState<SupabaseArtwork[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadFeaturedArtworks() {
      try {
        setLoading(true);
        setError("");

        const data = await getArtworks();

        const featured = data.filter(
          (artwork) =>
            artwork.featured === true &&
            artwork.image,
        );

        if (!mounted) return;

        setArtworks(featured);
        setCurrentIndex(0);
      } catch (err) {
        console.error(
          "Failed to load featured artworks:",
          err,
        );

        if (mounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load featured artworks.";

          setError(message);
          onError?.(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFeaturedArtworks();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * AUTOMATIC CAROUSEL
   *
   * Moves to the next artwork every 5 seconds.
   */
  useEffect(() => {
    if (artworks.length <= 1 || isDragging) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((previous) =>
        previous === artworks.length - 1
          ? 0
          : previous + 1,
      );
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [artworks.length, isDragging]);

  function goToPrevious() {
    setCurrentIndex((previous) =>
      previous === 0
        ? artworks.length - 1
        : previous - 1,
    );
  }

  function goToNext() {
    setCurrentIndex((previous) =>
      previous === artworks.length - 1
        ? 0
        : previous + 1,
    );
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (artworks.length <= 1) return;

    setIsDragging(true);
    setDragStart(event.clientX);
    setDragOffset(0);

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!isDragging) return;

    setDragOffset(
      event.clientX - dragStart,
    );
  }

  function handlePointerUp() {
    if (!isDragging) return;

    const threshold = 70;

    if (dragOffset > threshold) {
      goToPrevious();
    } else if (dragOffset < -threshold) {
      goToNext();
    }

    setIsDragging(false);
    setDragOffset(0);
  }

  function handlePointerCancel() {
    setIsDragging(false);
    setDragOffset(0);
  }


  return (
    <section className="featured-artwork">

      {/* HEADER */}

      <div className="featured-artwork-heading">
        <div>
          <p className="home-eyebrow home-theme-muted">
            FEATURED COLLECTION
          </p>

          <h2 className="font-serif text-4xl leading-[0.95] tracking-[-0.03em] home-theme-heading sm:text-5xl lg:text-6xl">
            Original works created
          with imagination, emotion and intention.
          </h2>
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <div className="featured-interactive-carousel">
          <div className="featured-carousel-stage">

            <article className="featured-interactive-card is-active">
              <div className="featured-interactive-image-wrap">

                <Skeleton
                  width="100%"
                  height="100%"
                  radius="inherit"
                />

                <div className="featured-carousel-info">

                  <div>
                    <Skeleton
                      width="7rem"
                      height="0.55rem"
                      radius="0.2rem"
                    />

                    <Skeleton
                      className="mt-3"
                      width="min(70%, 420px)"
                      height="2.5rem"
                      radius="0.4rem"
                    />

                    <Skeleton
                      className="mt-3"
                      width="9rem"
                      height="0.7rem"
                      radius="0.2rem"
                    />
                  </div>

                  <div className="featured-carousel-bottom">

                    <Skeleton
                      width="7rem"
                      height="1.4rem"
                      radius="0.3rem"
                    />

                    <Skeleton
                      width="8rem"
                      height="2.8rem"
                      radius="999px"
                    />

                  </div>

                </div>
              </div>
            </article>

          </div>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && null}

      {/* EMPTY */}

      {!loading &&
        !error &&
        artworks.length === 0 && (
          <div className="featured-carousel-state">
            No featured artworks available.
          </div>
        )}

      {/* CAROUSEL */}

      {!loading &&
        !error &&
        artworks.length > 0 && (
          <div className="featured-interactive-carousel">

            <div
              className={`featured-carousel-stage ${
                isDragging
                  ? "is-dragging"
                  : ""
              }`}
              onPointerDown={
                handlePointerDown
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                handlePointerUp
              }
              onPointerCancel={
                handlePointerCancel
              }
              style={{
                touchAction: "pan-y",
              }}
            >

              {artworks.map(
                (artwork, index) => {
                  const offset =
                    index - currentIndex;

                  let normalizedOffset =
                    offset;

                  if (
                    offset >
                    artworks.length / 2
                  ) {
                    normalizedOffset =
                      offset -
                      artworks.length;
                  }

                  if (
                    offset <
                    -artworks.length / 2
                  ) {
                    normalizedOffset =
                      offset +
                      artworks.length;
                  }

                  const isActive =
                    index === currentIndex;

                  return (
                    <article
                      key={artwork.id}
                      className={`featured-interactive-card ${
                        isActive
                          ? "is-active"
                          : ""
                      }`}
                      style={{
                        transform: `
                          translateX(
                            calc(
                              ${normalizedOffset * 100}%
                              + ${normalizedOffset * 24}px
                              + ${isActive ? dragOffset : 0}px
                            )
                          )
                          scale(
                            ${
                              isActive
                                ? 1
                                : 0.88
                            }
                          )
                        `,
                        opacity:
                          Math.abs(
                            normalizedOffset,
                          ) > 1
                            ? 0
                            : isActive
                              ? 1
                              : 0.55,
                        zIndex:
                          isActive
                            ? 10
                            : 5 -
                              Math.abs(
                                normalizedOffset,
                              ),
                      }}
                    >

                      <div className="featured-interactive-image-wrap">

                        <img
                          src={
                            artwork.image ??
                            ""
                          }
                          alt={
                            artwork.title ??
                            "Featured artwork"
                          }
                          className="featured-interactive-image"
                          draggable={false}
                        />

                        <div className="featured-carousel-gradient" />

                        <div className="featured-carousel-info">

                          <div>
                            <p className="featured-carousel-label">
                              {artwork.category ??
                                "ORIGINAL WORK"}
                            </p>

                            <h3>
                              {artwork.title}
                            </h3>

                            <p className="featured-carousel-medium">
                              {artwork.medium ??
                                "Original Artwork"}
                            </p>
                          </div>

                          <div className="featured-carousel-bottom">

                            <strong>
                              {formatPrice(
                                artwork.price,
                              )}
                            </strong>

                            <button
                              type="button"
                              className="featured-details-button"
                              onPointerDown={(event) =>
                                event.stopPropagation()
                              }
                              onClick={() =>
                                window.location.assign(
                                  `/shop?artwork=${encodeURIComponent(
                                    artwork.id,
                                  )}`,
                                )
                              }
                            >
                              <Eye size={18} />
                              View Details
                            </button>

                          </div>

                        </div>

                      </div>

                    </article>
                  );
                },
              )}

            </div>

            {/* CONTROLS */}

            {artworks.length > 1 && (
              <div className="featured-carousel-controls">

                <button
                  type="button"
                  onClick={goToPrevious}
                  className="featured-carousel-control"
                  aria-label="Previous artwork"
                >
                  <ArrowLeft size={19} />
                </button>

                <div className="featured-carousel-counter">
                  <span>
                    {String(
                      currentIndex + 1,
                    ).padStart(2, "0")}
                  </span>

                  <span className="featured-carousel-counter-line" />

                  <span>
                    {String(
                      artworks.length,
                    ).padStart(2, "0")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={goToNext}
                  className="featured-carousel-control"
                  aria-label="Next artwork"
                >
                  <ArrowRight size={19} />
                </button>

              </div>
            )}

          </div>
        )}

      {/* EXPLORE */}

      <div className="featured-artwork-link-wrap">
        <Link
          to="/shop"
          className="featured-artwork-link"
        >
          Explore all artworks
          <ArrowRight size={18} />
        </Link>
      </div>

    </section>
  );
}

function formatPrice(
  price: number | null,
): string {
  if (price === null) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    },
  ).format(price);
}
