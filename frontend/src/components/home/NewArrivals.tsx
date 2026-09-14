import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import {
  getArtworks,
  type Artwork as SupabaseArtwork,
} from "../../services/artworkService";
import Skeleton from "../ui/Skeleton";

function ArtworkCard({
  artwork,
  cardRef,
}: {
  artwork: SupabaseArtwork;
  cardRef: (element: HTMLDivElement | null) => void;
}) {
  const shopUrl = `/shop?artwork=${encodeURIComponent(
    artwork.id,
  )}`;

  return (
    <div
      ref={cardRef}
      className="new-arrivals-card shrink-0"
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        {/* IMAGE */}

        <Link
          to={shopUrl}
          className="group absolute inset-0 block"
          aria-label={`View ${artwork.title ?? "artwork"}`}
        >
          <img
            src={artwork.image ?? ""}
            alt={
              artwork.title ??
              "TboyArts artwork"
            }
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
        </Link>

        {/* TEXT ON IMAGE */}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <Link
            to={shopUrl}
            className="pointer-events-auto group inline-block"
          >
            <h3 className="font-serif text-xl leading-tight text-white sm:text-2xl">
              {artwork.title}
            </h3>

            <span className="mt-2 block h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewArrivalsSkeleton() {
  return (
    <section className="w-full overflow-hidden py-20">
      {/* HEADER */}

      <div className="mx-auto mb-12 flex max-w-[1600px] items-end justify-between gap-6 px-6 sm:px-10 lg:px-16">
        <div>
          <Skeleton
            width="7rem"
            height="0.65rem"
            radius="0.2rem"
          />

          <div className="mt-4 space-y-2">
            <Skeleton
              width="14rem"
              height="2.8rem"
              radius="0.4rem"
            />

            <Skeleton
              width="11rem"
              height="2.8rem"
              radius="0.4rem"
            />
          </div>
        </div>

        <Skeleton
          className="hidden sm:block"
          width="9rem"
          height="1rem"
          radius="0.3rem"
        />
      </div>

      {/* MARQUEE */}

      <div className="relative flex w-full justify-center overflow-hidden">
        <div className="new-arrivals-marquee flex w-max items-center">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div
              key={groupIndex}
              className="new-arrivals-group flex items-center"
            >
              {Array.from({ length: 4 }).map(
                (_, cardIndex) => (
                  <div
                    key={`${groupIndex}-${cardIndex}`}
                    className="new-arrivals-card shrink-0"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-2xl">
                      <Skeleton
                        width="100%"
                        height="100%"
                        radius="inherit"
                      />

                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                        <Skeleton
                          width="65%"
                          height="1.5rem"
                          radius="0.3rem"
                        />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE VIEW ALL */}

      <div className="mt-8 px-6 sm:hidden">
        <Skeleton
          width="8rem"
          height="1rem"
          radius="0.3rem"
        />
      </div>
    </section>
  );
}

interface NewArrivalsProps {
  onError?: (message: string) => void;
}

export default function NewArrivals({
  onError,
}: NewArrivalsProps) {
  const [artworks, setArtworks] = useState<
    SupabaseArtwork[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cardRefs =
    useRef<HTMLDivElement[]>([]);

  /*
   * LOAD NEW ARRIVALS FROM SUPABASE
   */

  useEffect(() => {
    let mounted = true;

    async function loadNewArrivals() {
      try {
        setLoading(true);
        setError("");

        const data = await getArtworks();

        if (!mounted) return;

        const newest = data
          .filter(
            (artwork) =>
              Boolean(artwork.image),
          )
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 8);

        setArtworks(newest);
      } catch (err) {
        console.error(
          "Failed to load new arrivals:",
          err,
        );

        if (mounted) {
          const message =
            err instanceof Error
              ? err.message
              : "Unable to load new arrivals.";

          setError(message);
          onError?.(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNewArrivals();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * CENTER CARD EFFECT
   */

  useEffect(() => {
    if (artworks.length === 0) {
      return;
    }

    let frame = 0;

    const updateCenterCard = () => {
      const screenCenter =
        window.innerWidth / 2;

      let closestCard:
        | HTMLDivElement
        | null = null;

      let closestDistance =
        Infinity;

      cardRefs.current.forEach(
        (card) => {
          if (!card) return;

          const rect =
            card.getBoundingClientRect();

          const cardCenter =
            rect.left +
            rect.width / 2;

          const distance =
            Math.abs(
              cardCenter -
                screenCenter,
            );

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestCard =
              card;
          }
        },
      );

      const mobile =
        window.innerWidth < 640;

      const normalWidth = mobile
        ? "50vw"
        : "20vw";

      const centerWidth = mobile
        ? "70vw"
        : "30vw";

      const normalHeight =
        "300px";

      const centerHeight =
        "350px";

      cardRefs.current.forEach(
        (card) => {
          if (!card) return;

          if (
            card === closestCard
          ) {
            card.style.width =
              centerWidth;

            card.style.height =
              centerHeight;

            card.style.zIndex =
              "10";
          } else {
            card.style.width =
              normalWidth;

            card.style.height =
              normalHeight;

            card.style.zIndex =
              "1";
          }
        },
      );

      frame =
        requestAnimationFrame(
          updateCenterCard,
        );
    };

    frame =
      requestAnimationFrame(
        updateCenterCard,
      );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [artworks]);

  if (loading) {
    return <NewArrivalsSkeleton />;
  }

  if (error) {
    return null;
  }

  if (artworks.length === 0) {
    return null;
  }

  /*
   * Duplicate the collection so the
   * marquee remains continuous.
   */

  const groups = [
    artworks,
    artworks,
    artworks,
  ];

  return (
    <section className="w-full overflow-hidden py-20">
      {/* HEADER */}

      <div className="mx-auto mb-12 flex max-w-[1600px] items-end justify-between gap-6 px-6 sm:px-10 lg:px-16">
        <div>
          <p className="home-eyebrow home-theme-muted">
            NEW ARRIVALS
          </p>

          <h2 className="font-serif text-4xl leading-[0.95] home-theme-heading sm:text-5xl lg:text-6xl">
            Fresh from
            <br />
            the studio.
          </h2>
        </div>

        <Link
          to="/shop"
          className="group hidden items-center gap-2 text-sm sm:flex"
        >
          View All Artwork

          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>

      {/* MARQUEE */}

      <div className="relative flex w-full justify-center overflow-hidden">
        <div className="new-arrivals-marquee flex w-max items-center">
          {groups.map(
            (group, groupIndex) => (
              <div
                key={groupIndex}
                className="new-arrivals-group flex items-center"
              >
                {group.map(
                  (artwork) => (
                    <ArtworkCard
                      key={`${groupIndex}-${artwork.id}`}
                      artwork={artwork}
                      cardRef={(
                        element,
                      ) => {
                        if (
                          element &&
                          !cardRefs.current.includes(
                            element,
                          )
                        ) {
                          cardRefs.current.push(
                            element,
                          );
                        }
                      }}
                    />
                  ),
                )}
              </div>
            ),
          )}
        </div>
      </div>

      {/* MOBILE VIEW ALL */}

      <div className="mt-8 px-6 sm:hidden">
        <Link
          to="/shop"
          className="group inline-flex items-center gap-2 text-sm"
        >
          View All Artwork

          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </div>
    </section>
  );
}
