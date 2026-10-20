import ProtectedImage from "../artwork/ProtectedImage";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNewestDrops,
  type Artwork,
} from "../../services/artworkService";

export default function HomeAdvertisement() {
  const navigate = useNavigate();

  const [drops, setDrops] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  const timerRef = useRef<number | null>(null);

  // Load newest drops
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getNewestDrops();
        if (!cancelled) {
          setDrops(data);
          setCurrent(0);
        }
      } catch (err) {
        console.error("Failed to load newest drops:", err);
        if (!cancelled) setDrops([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll only when there are multiple drops
  useEffect(() => {
    if (drops.length <= 1) return;

    timerRef.current = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % drops.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [drops.length]);

  const goTo = (index: number) => {
    setCurrent(index);
    // Reset timer
    if (timerRef.current) clearInterval(timerRef.current);
    if (drops.length > 1) {
      timerRef.current = window.setInterval(() => {
        setCurrent((prev) => (prev + 1) % drops.length);
      }, 4500);
    }
  };

  if (loading) {
    return (
      <section
        className="w-full bg-[var(--background)] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24"
        aria-hidden="true"
      >
        <div className="mx-auto h-[55vh] w-full max-w-[1800px] animate-pulse rounded-3xl bg-black/10 sm:h-[65vh] lg:h-[72vh]" />
      </section>
    );
  }

  // Nothing to show
  if (drops.length === 0) {
    return null;
  }

  const active = drops[current];
  const headerText = (active?.newest_drop_header || "").trim() || "New Drop";

  return (
    <section className="w-full bg-[var(--background)] px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="home-eyebrow home-theme-muted uppercase">
              {headerText}
            </p>
          </div>
        </div>

        {/* Main drop card – clicking goes to /ads */}
        <button
          type="button"
          onClick={() => navigate("/ads")}
          className="group relative block w-full overflow-hidden rounded-3xl text-left outline-none"
          aria-label={`View drop: ${active.title || "New artwork"}`}
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9]">
            {drops.map((drop, i) => (
              <div
                key={drop.id}
                className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  i === current
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-[1.03]"
                }`}
              >
                <ProtectedImage
                  src={drop.image ?? ""}
                  alt={drop.title ?? "Newest drop"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            ))}

            {/* Overlay info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-14">
              <h3 className="mt-2 max-w-2xl font-serif text-2xl text-white sm:text-3xl lg:text-5xl">
                {active.title || "Untitled"}
              </h3>
              {active.category && (
                <p className="mt-2 text-sm text-white/60">
                  {active.category}
                </p>
              )}
            </div>
          </div>
        </button>

        {/* Dots for multiple drops */}
        {drops.length > 1 && (
          <div className="mt-5 flex justify-center gap-2">
            {drops.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? "w-8 bg-[var(--text)]"
                    : "w-1.5 bg-[var(--text)]/30"
                }`}
                aria-label={`Go to drop ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}