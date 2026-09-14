import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import {
  getArtistPageSettings,
  getArtistPhilosophy,
  getArtistProcess,
  getArtistProfile,
  type ArtistPageSettings,
  type ArtistPhilosophy,
  type ArtistProcess,
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

const defaultSettings: ArtistPageSettings = {
  id: "",
  story_label: "My Story",
  story_heading: "Every artwork carries a story.",
  philosophy_label: "Philosophy",
  philosophy_heading: "The ideas behind the art",
  process_label: "The Process",
  process_heading: "From idea to artwork.",
  selected_works_label: "Selected Works",
  selected_works_heading: "A selection of my work",
  commission_label: "Commissions",
  commission_heading: "Create something uniquely yours.",
  commission_description:
    "Have an idea, memory, or vision? Commission a custom artwork created with your story in mind.",
  commission_button_text: "Request Commission",
  commission_button_url: "#commission",
  updated_at: "",
};

export default function Artist() {
  const [profile, setProfile] =
    useState<ArtistProfile>(defaultProfile);

  const [settings, setSettings] =
    useState<ArtistPageSettings>(defaultSettings);

  const [philosophy, setPhilosophy] =
    useState<ArtistPhilosophy[]>([]);

  const [process, setProcess] =
    useState<ArtistProcess[]>([]);

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

        const [
          profileData,
          settingsData,
          philosophyData,
          processData,
          artworkData,
        ] = await Promise.all([
          getArtistProfile(),
          getArtistPageSettings(),
          getArtistPhilosophy(),
          getArtistProcess(),
          getArtworks(),
        ]);

        if (profileData) {
          setProfile(profileData);
        }

        if (settingsData) {
          setSettings(settingsData);
        }

        setPhilosophy(philosophyData);
        setProcess(processData);

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
    philosophy,
    process,
    artworks,
  ]);

  const reveal = (id: string) =>
    visible.has(id);

  /*
   * STORY PARAGRAPHS
   */
  const storyParagraphs = profile.story
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

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
        description="Discover the artist, creative philosophy, process, and selected works behind TboyArts."
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

            <p className="mt-10 max-w-[680px] text-base leading-[1.8] text-[var(--muted-foreground,#777)] sm:mt-14 sm:text-xl lg:text-2xl">
              {profile.hero_text}
            </p>

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
          MY STORY
          ===================================================== */}

      <section className="border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">

        <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[220px_1fr] lg:gap-24">

          <div
            data-reveal="story-label"
            className={`flex items-start gap-4 text-[10px] uppercase tracking-[0.3em] opacity-50 transition-all duration-700 ${
              reveal("story-label")
                ? "translate-y-0 opacity-50"
                : "translate-y-6 opacity-0"
            }`}
          >

            <span>01</span>

            <span>
              {settings.story_label}
            </span>

          </div>


          <div
            data-reveal="story-content"
            className={`grid gap-12 transition-all duration-[900ms] ease-out lg:grid-cols-[1fr_0.8fr] lg:gap-24 ${
              reveal("story-content")
                ? "translate-y-0 opacity-100"
                : "translate-y-12 opacity-0"
            }`}
          >

            <h2 className="font-serif text-[clamp(3rem,6vw,6.5rem)] font-normal leading-[0.9] tracking-[-0.055em]">
              {settings.story_heading}
            </h2>


            <div className="max-w-[620px] space-y-7 text-base leading-[1.85] text-[var(--muted-foreground,#777)] sm:text-lg">

              {storyParagraphs.length > 0 ? (

                storyParagraphs.map(
                  (paragraph, index) => (
                    <p key={index}>
                      {paragraph}
                    </p>
                  ),
                )

              ) : (

                <p>
                  Every artwork carries a story.
                  Art is more than creating
                  something beautiful. It is about
                  capturing emotions, memories and
                  ideas that words sometimes cannot
                  express.
                </p>

              )}

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PHILOSOPHY
          ===================================================== */}

      <section className="px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">

        <div className="mx-auto max-w-[1500px]">

          <div
            data-reveal="philosophy-heading"
            className={`mb-16 transition-all duration-[900ms] sm:mb-24 ${
              reveal("philosophy-heading")
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >

            <p className="mb-6 text-[10px] uppercase tracking-[0.3em] opacity-50">
              02
            </p>

            <h2 className="font-serif text-[clamp(3.5rem,7vw,8rem)] leading-[0.88] tracking-[-0.06em]">
              {settings.philosophy_heading}
            </h2>

          </div>


          <div className="grid border-t border-[var(--border)] md:grid-cols-2 lg:grid-cols-4">

            {philosophy.map(
              (item, index) => (

                <article
                  key={item.id}
                  data-reveal={`philosophy-${index}`}
                  className={`border-b border-[var(--border)] p-6 transition-all duration-[800ms] ease-out md:min-h-[310px] md:border-r md:p-8 lg:border-b-0 lg:last:border-r-0 ${
                    reveal(
                      `philosophy-${index}`,
                    )
                      ? "translate-y-0 opacity-100"
                      : "translate-y-10 opacity-0"
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >

                  <span className="text-[10px] tracking-[0.25em] opacity-40">
                    {String(index + 1).padStart(
                      2,
                      "0",
                    )}
                  </span>

                  <h3 className="mt-14 font-serif text-3xl tracking-[-0.03em] sm:text-4xl">
                    {item.title}
                  </h3>

                  <p className="mt-5 text-sm leading-[1.8] text-[var(--muted-foreground,#777)] sm:text-base">
                    {item.description}
                  </p>

                </article>

              ),
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          PROCESS
          ===================================================== */}

      <section className="border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">

        <div className="mx-auto max-w-[1500px]">

          <div
            data-reveal="process-heading"
            className={`mb-16 transition-all duration-[900ms] sm:mb-24 ${
              reveal("process-heading")
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >

            <p className="mb-6 text-[10px] uppercase tracking-[0.3em] opacity-50">
              03
            </p>

            <h2 className="font-serif text-[clamp(3.5rem,7vw,8rem)] leading-[0.88] tracking-[-0.06em]">
              {settings.process_heading}
            </h2>

          </div>


          <div className="relative">

            {/* CONNECTING LINE */}

            <div className="absolute bottom-8 left-[23px] top-8 w-px overflow-hidden bg-[var(--border)] sm:left-[31px]">

              <div
                className="h-full w-full origin-top bg-[var(--foreground)] transition-all duration-[1800ms] ease-out"
                style={{
                  transform: reveal(
                    "process-line",
                  )
                    ? "scaleY(1)"
                    : "scaleY(0)",
                }}
              />

            </div>


            <div
              data-reveal="process-line"
              className="relative space-y-14 sm:space-y-20"
            >

              {process.map(
                (step, index) => (

                  <article
                    key={step.id}
                    data-reveal={`process-${index}`}
                    className={`relative grid grid-cols-[48px_1fr] gap-7 transition-all duration-[900ms] ease-out sm:grid-cols-[64px_1fr] sm:gap-10 ${
                      reveal(
                        `process-${index}`,
                      )
                        ? "translate-x-0 opacity-100"
                        : "translate-x-10 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${index * 130}ms`,
                    }}
                  >

                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[10px] font-medium tracking-widest sm:h-16 sm:w-16">
                      {String(index + 1).padStart(
                        2,
                        "0",
                      )}
                    </div>


                    <div className="pb-2">

                      <h3 className="font-serif text-3xl tracking-[-0.03em] sm:text-5xl">
                        {step.title}
                      </h3>

                      <p className="mt-4 max-w-[650px] text-base leading-[1.8] text-[var(--muted-foreground,#777)] sm:text-lg">
                        {step.description}
                      </p>

                    </div>

                  </article>

                ),
              )}

            </div>

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
                04
              </p>

              <h2 className="font-serif text-[clamp(3.5rem,7vw,8rem)] leading-[0.88] tracking-[-0.06em]">
                {settings.selected_works_heading}
              </h2>

            </div>

            <p className="max-w-[360px] text-sm leading-[1.7] text-[var(--muted-foreground,#777)]">
              {settings.selected_works_label}
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


      {/* =====================================================
          COMMISSION
          ===================================================== */}

      <section
        id="commission"
        className="border-t border-[var(--border)] px-6 py-24 sm:px-10 sm:py-32 lg:px-16 lg:py-44"
      >

        <div
          data-reveal="commission"
          className={`mx-auto max-w-[1500px] transition-all duration-[1000ms] ease-out ${
            reveal("commission")
              ? "translate-y-0 opacity-100"
              : "translate-y-12 opacity-0"
          }`}
        >

          <p className="mb-7 text-[10px] uppercase tracking-[0.42em] opacity-50">
            {settings.commission_label}
          </p>

          <h2 className="max-w-[1100px] font-serif text-[clamp(3.5rem,8vw,9rem)] leading-[0.86] tracking-[-0.065em]">
            {settings.commission_heading}
          </h2>

          <p className="mt-10 max-w-[620px] text-base leading-[1.8] text-[var(--muted-foreground,#777)] sm:mt-14 sm:text-xl">
            {settings.commission_description}
          </p>

          <Link
            to={
              settings.commission_button_url ||
              "#commission"
            }
            className="mt-10 inline-flex items-center gap-4 rounded-full border border-[var(--foreground)] px-6 py-4 text-sm transition-all duration-300 hover:bg-[var(--foreground)] hover:text-[var(--background)] sm:mt-14"
          >
            {settings.commission_button_text}

            <ArrowUpRight size={18} />
          </Link>

        </div>

      </section>

      </main>
      )}
      <Footer />
    </>
  );
}
