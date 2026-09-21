import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Skeleton from "../ui/Skeleton";

import {
  getHeroSettings,
  type HeroSettings,
} from "../../services/homepageService";

export default function Hero() {
  const [settings, setSettings] =
    useState<HeroSettings | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHero() {
      try {
        const data = await getHeroSettings();
        setSettings(data);
      } catch (error) {
        console.error(
          "Failed to load homepage hero:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadHero();
  }, []);

  /*
   * Keep the hero area stable while Supabase loads.
   */
  if (loading) {
    return (
      <section className="home-hero">
        <Skeleton
          className="absolute inset-0"
          width="100%"
          height="100%"
          radius="0"
        />

        <div className="home-hero-content">
          <Skeleton
            width="7rem"
            height="0.6rem"
            radius="0.2rem"
          />

          <div className="mt-6 space-y-3">
            <Skeleton
              width="min(70vw, 650px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />

            <Skeleton
              width="min(55vw, 500px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />

            <Skeleton
              width="min(65vw, 580px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />
          </div>

          <Skeleton
            className="mt-8"
            width="min(80vw, 620px)"
            height="3.5rem"
            radius="0.4rem"
          />

          <div className="mt-8 flex gap-4">
            <Skeleton
              width="8rem"
              height="3rem"
              radius="999px"
            />

            <Skeleton
              width="9rem"
              height="3rem"
              radius="999px"
            />
          </div>
        </div>
      </section>
    );
  }

  /*
   * If Supabase has no hero settings,
   * don't render a broken section.
   */
  if (!settings) {
    return null;
  }

  const titleLines = settings.heroTitle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="home-hero">
      {/* HERO IMAGE */}

      {settings.heroImage && (
        <img
          src={settings.heroImage}
          alt="Original TboyArts artwork"
          className="home-hero-image"
          decoding="async"
        />
      )}

      <div className="home-hero-overlay" />

      {/* HERO CONTENT */}

      <div className="home-hero-content">
        {settings.heroLabel && (
          <p className="home-eyebrow">
            {settings.heroLabel}
          </p>
        )}

        {titleLines.length > 0 && (
          <h1 className="home-hero-title">
            {titleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}

                {index < titleLines.length - 1 && (
                  <br />
                )}
              </span>
            ))}
          </h1>
        )}

        {settings.heroDescription && (
          <p className="home-hero-description">
            {settings.heroDescription}
          </p>
        )}

        <div className="home-hero-actions">
          {settings.primaryButtonText &&
            settings.primaryButtonUrl && (
              <Link
                to={settings.primaryButtonUrl}
                className="home-primary-button"
              >
                {settings.primaryButtonText}
              </Link>
            )}

          {settings.secondaryButtonText &&
            settings.secondaryButtonUrl && (
              <Link
                to={settings.secondaryButtonUrl}
                className="home-secondary-button"
              >
                {settings.secondaryButtonText}

                <ArrowRight size={18} />
              </Link>
            )}
        </div>
      </div>
    </section>
  );
}
