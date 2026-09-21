import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

import {
  getArtistProfile,
  type ArtistProfile,
} from "../services/artistService";

import {
  getArtworks,
  type Artwork,
} from "../services/artworkService";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ArtistSkeleton from "../components/ui/ArtistSkeleton";
import ErrorState from "../components/errors/ErrorState";
import SEO from "../components/seo/SEO";

const defaultProfile: ArtistProfile = {
  id: "",
  name: "The Artist",
  tagline: "",
  hero_text:
    "Every artwork begins with an idea, grows through emotion, and becomes a story on canvas.",
  story: "",
  profile_image: null,
  updated_at: "",
};

export default function Artist() {
  const [profile, setProfile] =
    useState<ArtistProfile>(defaultProfile);



  const [artworks, setArtworks] =
    useState<Artwork[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [visible, setVisible] =
    useState<Set<string>>(new Set());

  /*
   * LOAD ALL ARTIST CONTENT
   */
  useEffect(() => {
    async function loadArtistPage() {
      try {
        setLoading(true);
        setError("");

        const [profileData, artworkData] = await Promise.all([
          getArtistProfile(),
          getArtworks(),
        ]);

        if (profileData) {
          setProfile(profileData);
        }

        const exhibitionArtworks = artworkData
          .filter((artwork) => Boolean(artwork.image))
          .slice(0, 4);

        setArtworks(exhibitionArtworks);
      } catch (error) {
        console.error(
          "Failed to load artist page:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load the artist page.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadArtistPage();
  }, []);

  /*
   * SCROLL REVEAL
   */
  useEffect(() => {
    const elements =
      document.querySelectorAll<HTMLElement>(
        "[data-reveal]",
      );

    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const id =
              entry.target.getAttribute(
                "data-reveal",
              );

            if (id) {
              setVisible((current) => {
                const next = new Set(current);
                next.add(id);
                return next;
              });
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin:
            "0px 0px -60px 0px",
        },
      );

    elements.forEach((element) =>
      observer.observe(element),
    );

    return () =>
      observer.disconnect();
  }, [
    loading,
    artworks,
  ]);

  const reveal = (id: string) =>
    visible.has(id);

  /*
   * SUPABASE PROFILE IMAGE
   *
   * The artist profile image is now managed
   * through Supabase Storage.
   */
  const heroImage =
    profile.profile_image?.trim() || "";

  return (
    <>
      <SEO
        title="About the Artist — TboyArts"
        description="Discover the artist and selected works behind TboyArts."
      />
      <Navbar />

      {loading ? (
        <ArtistSkeleton />
      ) : error ? (
        <ErrorState
          type="server"
          fullPage
          title="Unable to Load Artist Page"
          message={
            error ||
            "We couldn't load the artist information right now. Please try again."
          }
          actionLabel="Try Again"
        />
      ) : (
        <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="px-6 pb-20 pt-32 sm:px-10 sm:pb-28 sm:pt-40 lg:px-16 lg:pb-36 lg:pt-48">
        <div className="mx-auto max-w-[1500px]">

          <div
            data-reveal="hero-text"
            className={`transition-all duration-[1000ms] ease-out ${
              reveal("hero-text")
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >

            <div className="mb-12 max-w-[900px]">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-current opacity-30 sm:w-16" />
                <span className="text-[9px] font-medium uppercase tracking-[0.42em] opacity-45 sm:text-[10px]">
                  Artist
                </span>
              </div>

              <h2 className="artist-name mt-5 max-w-full break-words font-serif text-[clamp(2.8rem,6vw,6.5rem)] font-normal leading-[0.88] tracking-[-0.055em]">
                {profile.name}
              </h2>

              {profile.tagline?.trim() && (
                <p className="mt-6 max-w-[680px] text-[11px] font-medium uppercase leading-[1.8] tracking-[0.28em] opacity-50 sm:text-xs lg:text-sm">
                  {profile.tagline}
                </p>
              )}
            </div>

            <div className="mt-10 max-w-[900px] text-base leading-[1.8] text-[var(--muted-foreground,#777)] sm:mt-14 sm:text-xl lg:text-2xl [&>p]:mb-7 [&>p:last-child]:mb-0 [&>h3]:mt-12 [&>h3]:mb-5 [&>h3]:font-serif [&>h3]:text-3xl [&>h3]:font-normal [&>h3]:leading-tight [&>h3]:tracking-[-0.02em] sm:[&>h3]:text-4xl lg:[&>h3]:text-5xl">
              <ReactMarkdown>
                {profile.hero_text?.replace(/^(#{1,6})(?=\S)/gm, "$1 ")}
              </ReactMarkdown>
            </div>

          </div>

          <div
            data-reveal="hero-image"
            className={`mt-14 overflow-hidden rounded-[28px] transition-all duration-[1200ms] delay-150 ease-out sm:mt-20 sm:rounded-[38px] lg:mt-24 lg:rounded-[44px] ${
              reveal("hero-image")
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-12 scale-[0.97] opacity-0"
            }`}
          >

            <img
              src={heroImage}
              alt={
                profile.name ||
                "TboyArts artist"
              }
              className="block aspect-[4/5] w-full object-cover sm:aspect-[16/10]"
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          EXHIBITION
          ===================================================== */}

      <section className="px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">

        <div className="mx-auto max-w-[1500px]">

          <div
            data-reveal="exhibition-heading"
            className={`mb-14 flex flex-col justify-between gap-8 transition-all duration-[900ms] sm:mb-20 sm:flex-row sm:items-end ${
              reveal(
                "exhibition-heading",
              )
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >

            <div>

              <p className="mb-6 text-[10px] uppercase tracking-[0.3em] opacity-50">
                01
              </p>

              <h2 className="font-serif text-[clamp(3.5rem,7vw,8rem)] leading-[0.88] tracking-[-0.06em]">
                A selection of my work
              </h2>

            </div>

            <p className="max-w-[360px] text-sm leading-[1.7] text-[var(--muted-foreground,#777)]">
              Selected Works
            </p>

          </div>


          {artworks.length > 0 ? (

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:gap-10">

              {artworks.map(
                (artwork, index) => (

                  <Link
                    key={artwork.id}
                    to={
                      artwork.category
                        ? `/shop?category=${encodeURIComponent(
                            artwork.category,
                          )}`
                        : "/shop"
                    }
                    data-reveal={`exhibition-${index}`}
                    className={`group block transition-all duration-[900ms] ease-out ${
                      reveal(
                        `exhibition-${index}`,
                      )
                        ? "translate-y-0 opacity-100"
                        : "translate-y-12 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${index * 120}ms`,
                    }}
                  >

                    <div className="overflow-hidden rounded-[24px] bg-[var(--surface,#f5f5f5)] sm:rounded-[30px]">

                      <img
                        src={artwork.image ?? ""}
                        alt={
                          artwork.title ??
                          "TboyArts artwork"
                        }
                        className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                        loading="lazy"
                        decoding="async"
                      />

                    </div>


                    <div className="mt-5 flex items-start justify-between gap-5">

                      <div>

                        <h3 className="text-lg font-medium tracking-[-0.02em] sm:text-xl">
                          {artwork.title ??
                            "Untitled"}
                        </h3>

                        <p className="mt-1 text-xs uppercase tracking-[0.15em] opacity-45">
                          {artwork.category ??
                            "Artwork"}
                        </p>

                      </div>


                      <ArrowUpRight
                        size={20}
                        className="mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                      />

                    </div>

                  </Link>

                ),
              )}

            </div>

          ) : (

            <div
              data-reveal="exhibition-empty"
              className="border-t border-[var(--border)] py-16 text-sm opacity-50"
            >
              No exhibition artworks
              available yet.
            </div>

          )}


          <div
            data-reveal="exhibition-link"
            className={`mt-14 transition-all duration-[900ms] sm:mt-20 ${
              reveal(
                "exhibition-link",
              )
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >

            <Link
              to="/shop"
              className="inline-flex items-center gap-3 border-b border-[var(--foreground)] pb-3 text-sm transition-opacity hover:opacity-55"
            >
              Explore the collection
              <ArrowUpRight size={17} />
            </Link>

          </div>

        </div>

      </section>

      </main>
      )}
      <Footer />
    </>
  );
}
