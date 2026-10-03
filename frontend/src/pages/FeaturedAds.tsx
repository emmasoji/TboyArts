import { FeaturedAdsRouteSkeleton } from "../components/ui/RouteLoadingFallback";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import SEO from "../components/seo/SEO";
import ErrorState from "../components/errors/ErrorState";

import {
  getActiveAdvertisement,
  type Advertisement,
  type AdvertisementProduct,
} from "../services/advertisementService";

export default function FeaturedAds() {
  const navigate = useNavigate();

  const [advertisement, setAdvertisement] =
    useState<Advertisement | null>(null);
  const [currentIndex, setCurrentIndex] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [showNavigation, setShowNavigation] = useState(true);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAdvertisement = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getActiveAdvertisement();

        if (cancelled) return;

        setAdvertisement(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error(
          "Failed to load featured advertisement page:",
          err,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the featured advertisement.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAdvertisement();

    return () => {
      cancelled = true;
    };
  }, []);

  const products =
    advertisement?.products ?? [];

  const productCount = products.length;

  const currentProduct =
    products[
      Math.min(
        currentIndex,
        Math.max(productCount - 1, 0),
      )
    ]!;

  const goTo = useCallback(
    (index: number) => {
      if (productCount === 0) return;

      setCurrentIndex(
        ((index % productCount) + productCount) %
          productCount,
      );
    },
    [productCount],
  );

  const next = useCallback(() => {
    if (productCount <= 1) return;

    setCurrentIndex(
      (currentIndex + 1) % productCount,
    );
  }, [currentIndex, productCount]);

  const previous = useCallback(() => {
    if (productCount <= 1) return;

    setCurrentIndex(
      (currentIndex - 1 + productCount) %
        productCount,
    );
  }, [currentIndex, productCount]);

  useEffect(() => {
    if (productCount <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) =>
        (index + 1) % productCount,
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [productCount]);

  const handleTouchStart = (
    event: React.TouchEvent<HTMLElement>,
  ) => {
    registerInteraction();
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
    touchCurrentX.current =
      touchStartX.current;
  };

  const handleTouchMove = (
    event: React.TouchEvent<HTMLElement>,
  ) => {
    touchCurrentX.current =
      event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchCurrentX.current === null ||
      productCount <= 1
    ) {
      touchStartX.current = null;
      touchCurrentX.current = null;
      return;
    }

    const distance =
      touchStartX.current -
      touchCurrentX.current;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        next();
      } else {
        previous();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const registerInteraction = useCallback(() => {
    setShowNavigation(true);

    if (navigationTimer.current !== null) {
      window.clearTimeout(navigationTimer.current);
    }

    navigationTimer.current = window.setTimeout(() => {
      setShowNavigation(false);
    }, 3000);
  }, []);

  useEffect(() => {
    registerInteraction();

    return () => {
      if (navigationTimer.current !== null) {
        window.clearTimeout(navigationTimer.current);
      }
    };
  }, [registerInteraction]);

  const openArtwork = (
    product: AdvertisementProduct,
  ) => {
    if (!product.artwork.customer_visible) {
      return;
    }

    navigate("/shop", {
      state: {
        artworkId: product.artwork.id,
      },
    });
  };

  if (loading) {
    return <FeaturedAdsRouteSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ErrorState
          type="server"
          message={error}
        />
      </div>
    );
  }

  if (!advertisement || productCount === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-white/20 px-5 py-3 text-sm text-white/80 transition hover:bg-white/10"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={
          advertisement.title
            ? `${advertisement.title} — TboyArts`
            : "Featured Collection — TboyArts"
        }
        description={
          advertisement.text ||
          "Explore the featured TboyArts collection."
        }
      />

      <div className="min-h-screen bg-black text-white">
        <main
          className="relative min-h-screen overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={registerInteraction}
          onPointerMove={registerInteraction}
        >
          {/* Full-screen artwork */}
          <div className="fixed inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="sync" initial={false}>
              {currentProduct.artwork.image ? (
                <motion.img
                  key={currentProduct.artwork.id}
                  src={currentProduct.artwork.image}
                  alt={
                    currentProduct.artwork.title ??
                    currentProduct.title
                  }
                  initial={{
                    opacity: 0,
                    scale: 1.035,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.985,
                  }}
                  transition={{
                    opacity: {
                      duration: 0.8,
                      ease: "easeInOut",
                    },
                    scale: {
                      duration: 1.1,
                      ease: "easeOut",
                    },
                  }}
                  className="absolute inset-0 h-full w-full select-none object-cover object-center"
                  draggable={false}
                />
              ) : (
                <motion.div
                  key="artwork-unavailable"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/50"
                >
                  Artwork image unavailable
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Curved black cinematic overlay */}
          <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M 0 0 H 12 C 0 22, 18 72, 100 100 H 0 Z"
                fill="black"
                fillOpacity="0.88"
              />
            </svg>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="absolute right-5 top-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:right-8 sm:top-8"
          >
            <X size={19} />
          </button>

          {/* Product information */}
          <div className="relative z-20 flex min-h-screen w-full items-end">
            <section className="w-full px-6 pb-16 pt-24 sm:px-10 sm:pb-20 lg:w-[62%] lg:px-16 lg:pb-24 xl:w-[56%]">
              <div className="max-w-xl">
                {advertisement.title && (
                  <p className="mb-4 text-xs uppercase tracking-[0.32em] text-white/55">
                    {advertisement.title}
                  </p>
                )}

                <h1 className="text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {currentProduct.title ||
                    currentProduct.artwork.title}
                </h1>

                {currentProduct.text && (
                  <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
                    {currentProduct.text}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    openArtwork(currentProduct)
                  }
                  disabled={
                    !currentProduct.artwork
                      .customer_visible
                  }
                  className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-default disabled:bg-white/15 disabled:text-white/60"
                >
                  {currentProduct.artwork
                    .customer_visible
                    ? "View Artwork"
                    : "Coming Soon"}
                </button>

                {/* Artwork thumbnails */}
                {productCount > 1 && (
                  <div className="mt-10 flex max-w-full gap-3 overflow-x-auto pb-2">
                    {products.map(
                      (product, index) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            goTo(index)
                          }
                          aria-label={`Show ${
                            product.title ||
                            product.artwork.title ||
                            `artwork ${index + 1}`
                          }`}
                          aria-current={
                            index === currentIndex
                          }
                          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition sm:h-20 sm:w-20 ${
                            index === currentIndex
                              ? "border-white opacity-100"
                              : "border-white/20 opacity-55 hover:opacity-100"
                          }`}
                        >
                          {product.artwork.image ? (
                            <img
                              src={
                                product.artwork.image
                              }
                              alt={
                                product.artwork.title ??
                                product.title
                              }
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-white/5 text-[10px] text-white/40">
                              No image
                            </span>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Carousel arrows */}
          {productCount > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  registerInteraction();
                  previous();
                }}
                aria-label="Previous artwork"
                className={`absolute left-4 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all duration-700 ease-in-out sm:left-8 ${
                  showNavigation
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-3 opacity-0 pointer-events-none"
                }`}
              >
                <ChevronLeft size={21} />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  registerInteraction();
                  next();
                }}
                aria-label="Next artwork"
                className={`absolute right-4 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all duration-700 ease-in-out sm:right-8 ${
                  showNavigation
                    ? "translate-x-0 opacity-100"
                    : "translate-x-3 opacity-0 pointer-events-none"
                }`}
              >
                <ChevronRight size={21} />
              </button>
            </>
          )}
          </main>
      </div>
    </>
  );
}
