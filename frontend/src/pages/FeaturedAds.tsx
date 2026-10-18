import ProtectedImage from "../components/artwork/ProtectedImage";
import { FeaturedAdsRouteSkeleton } from "../components/ui/RouteLoadingFallback";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
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
  getNewestDrops,
  type Artwork,
} from "../services/artworkService";

export default function FeaturedAds() {
  const navigate = useNavigate();

  const [drops, setDrops] = useState<Artwork[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNavigation, setShowNavigation] = useState(true);

  const touchStartX = useRef<number | null>(null);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getNewestDrops();

        if (cancelled) return;

        setDrops(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Failed to load newest drops:", err);
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the newest drops.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const count = drops.length;
  const current = drops[Math.min(currentIndex, Math.max(count - 1, 0))];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setCurrentIndex(((index % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  // Auto-hide navigation
  useEffect(() => {
    const show = () => {
      setShowNavigation(true);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      navigationTimer.current = window.setTimeout(() => {
        setShowNavigation(false);
      }, 3000);
    };

    show();
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);

    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, navigate]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (loading) {
    return <FeaturedAdsRouteSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        type="server"
        fullPage
        title="Unable to Load Drops"
        message={error}
        actionLabel="Go Home"
        onAction={() => navigate("/")}
      />
    );
  }

  if (count === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          New Drops
        </p>
        <h1 className="mt-4 font-serif text-3xl sm:text-4xl">
          No drops available right now
        </h1>
        <button
          type="button"
          onClick={() => navigate("/shop")}
          className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          Browse the Shop
        </button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="New Drops — TboyArts"
        description="Discover the latest artwork drops from TboyArts."
      />

      <div
        className="relative min-h-screen overflow-hidden bg-black text-white"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Background image with crossfade */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <ProtectedImage
                src={current.image ?? ""}
                alt={current.title ?? "Newest drop"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`fixed right-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:right-8 sm:top-8 ${
            showNavigation ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close"
        >
          <X size={19} />
        </button>

        {/* Navigation arrows (only if multiple) */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className={`fixed left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:left-8 ${
                showNavigation ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Previous drop"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className={`fixed right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50 sm:right-8 ${
                showNavigation ? "opacity-100" : "opacity-0"
              }`}
              aria-label="Next drop"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Content */}
        <div className="relative z-20 flex min-h-screen w-full items-end">
          <section className="w-full px-6 pb-16 pt-24 sm:px-10 sm:pb-20 lg:w-[60%] lg:px-16 lg:pb-24">
            <div className="max-w-xl">

              <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {current.title || "Untitled"}
              </h1>

              {current.description && (
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base line-clamp-4">
                  {current.description}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
  type="button"
  onClick={() => navigate(`/shop?artwork=${current.id}`)}
  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
>
  See more
  <ArrowUpRight size={16} />
</button>

                {current.category && (
                  <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/60">
                    {current.category}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {count > 1 && (
                <div className="mt-10 flex max-w-full gap-3 overflow-x-auto pb-2">
                  {drops.map((drop, index) => (
                    <button
                      key={drop.id}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Show ${drop.title || `drop ${index + 1}`}`}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                        index === currentIndex
                          ? "border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <ProtectedImage
                        src={drop.image ?? ""}
                        alt={drop.title ?? ""}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}