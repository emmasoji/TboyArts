import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import Skeleton from "../ui/Skeleton";

import {
  getAboutSettings,
  type AboutSettings,
} from "../../services/homepageService";

interface ArtistStoryProps {
  onError?: (message: string) => void;
}

export default function ArtistStory({
  onError,
}: ArtistStoryProps) {
  const [settings, setSettings] =
    useState<AboutSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadAboutSettings() {
      try {
        setError("");

        const data =
          await getAboutSettings();

        if (mounted) {
          setSettings(data);
        }
      } catch (error) {
        console.error(
          "Failed to load homepage about settings:",
          error,
        );

        if (mounted) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load the artist story.";

          setError(message);
          onError?.(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAboutSettings();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Default content.
   * These are used if the About settings
   * cannot be retrieved.
   */

  const aboutLabel =
    settings?.aboutLabel ||
    "MEET THE ARTIST";

  const aboutTitle =
    settings?.aboutTitle ||
    "Creating stories\nthrough art.";

  const aboutDescription =
    settings?.aboutDescription ||
    "Every artwork is created to capture emotion, imagination and moments that words cannot fully express.";

  const aboutImage =
    settings?.aboutImage || "";

  const aboutButtonText =
    settings?.aboutButtonText ||
    "Learn More";

  const aboutButtonUrl =
    settings?.aboutButtonUrl ||
    "/artist";

  /*
   * Split the heading by line breaks so the
   * admin can control the heading layout.
   */

  const titleLines =
    aboutTitle.split("\n");

  if (error) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden bg-[#111113] py-20 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:px-16 xl:gap-28">

        {/* IMAGE */}

        <div className="relative order-1 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] lg:order-1">
          <div className="aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-[4/5]">
            {loading ? (
              <Skeleton
                width="100%"
                height="100%"
                radius="inherit"
                className="!bg-white/[0.06]"
              />
            ) : (
              <img
                src={aboutImage}
                alt="TboyArts artist"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        {/* CONTENT */}

        <div className="order-2 max-w-2xl lg:order-2">
          {loading ? (
            <div
              className="animate-[artistStoryContentIn_500ms_ease-out_both]"
              aria-hidden="true"
            >
              {/* EYEBROW */}

              <Skeleton
                width="9rem"
                height="0.7rem"
                radius="0.2rem"
              />

              {/* HEADING */}

              <div className="mt-7 space-y-3 sm:mt-8">
                <Skeleton
                  width="min(100%, 30rem)"
                  height="4.5rem"
                  radius="0.45rem"
                />

                <Skeleton
                  width="min(80%, 24rem)"
                  height="4.5rem"
                  radius="0.45rem"
                />
              </div>

              {/* DESCRIPTION */}

              <div className="mt-9 max-w-xl space-y-3 sm:mt-10">
                <Skeleton
                  width="100%"
                  height="0.9rem"
                  radius="0.25rem"
                />

                <Skeleton
                  width="92%"
                  height="0.9rem"
                  radius="0.25rem"
                />

                <Skeleton
                  width="72%"
                  height="0.9rem"
                  radius="0.25rem"
                />
              </div>

              {/* BUTTON */}

              <Skeleton
                className="mt-10 sm:mt-12"
                width="10rem"
                height="3.5rem"
                radius="999px"
              />
            </div>
          ) : (
            <>
              {/* EYEBROW */}

              <p className="mb-7 text-xs font-medium uppercase tracking-[0.35em] text-white/45 sm:mb-8 sm:text-sm">
                {aboutLabel}
              </p>

              {/* HEADING */}

              <h2 className="font-serif text-[3.2rem] leading-[0.92] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
                {titleLines.map(
                  (line, index) => (
                    <span
                      key={`${line}-${index}`}
                      className={
                        index ===
                        titleLines.length - 1
                          ? "italic"
                          : undefined
                      }
                    >
                      {line}

                      {index <
                        titleLines.length - 1 && (
                        <br />
                      )}
                    </span>
                  ),
                )}
              </h2>

              {/* DESCRIPTION */}

              <div className="mt-9 max-w-xl sm:mt-10">
                <p className="whitespace-pre-line text-base leading-8 text-white/55 sm:text-lg sm:leading-8">
                  {aboutDescription}
                </p>
              </div>

              {/* BUTTON */}

              <Link
                to={aboutButtonUrl}
                className="group mt-10 inline-flex min-h-14 items-center gap-5 rounded-full border border-white/10 px-7 text-sm font-medium !text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.04] sm:mt-12 sm:px-8"
              >
                <span className="!text-white">
                  {aboutButtonText}
                </span>

                <ArrowRight
                  size={19}
                  className="!text-white transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
