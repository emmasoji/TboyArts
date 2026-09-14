import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import Skeleton from "../ui/Skeleton";

interface Category {
  id: string;
  name: string | null;
  image: string | null;
  featured: boolean;
  display_order: number;
}

interface BrowseCategoriesProps {
  onError?: (message: string) => void;
}

export default function BrowseCategories({
  onError,
}: BrowseCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        setError("");
        const { data, error } = await supabase
          .from("categories")
          .select(
            "id, name, image, featured, display_order",
          )
          .eq("featured", true)
          .order("display_order", {
            ascending: true,
          })
          .limit(4);

        if (error) {
          throw error;
        }

        setCategories(data ?? []);
      } catch (error) {
        console.error(
          "Failed to load browse categories:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load browse categories.";

        setError(message);
        onError?.(message);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  if (loading) {
    return (
      <section className="w-full overflow-hidden py-20 sm:py-24 lg:py-32">
        <div className="mx-auto mb-10 max-w-[1500px] px-6 sm:px-10 lg:px-16">
          <Skeleton width="10rem" height="0.6rem" radius="0.2rem" />

          <Skeleton
            className="mt-5"
            width="min(80vw, 650px)"
            height="3.5rem"
            radius="0.5rem"
          />

          <Skeleton
            className="mt-5"
            width="min(80vw, 480px)"
            height="2rem"
            radius="0.4rem"
          />
        </div>

        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
            >
              <Skeleton
                width="100%"
                height="100%"
                radius="inherit"
              />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <Skeleton width="55%" height="2rem" radius="0.4rem" />
                <Skeleton
                  className="mt-4"
                  width="45%"
                  height="0.7rem"
                  radius="0.2rem"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return null;
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full overflow-hidden py-20 sm:py-24 lg:py-32">

      {/* HEADER */}

      <div className="mx-auto mb-10 max-w-[1500px] px-6 sm:px-10 lg:px-16">

        <p className="home-eyebrow home-theme-muted">
          BROWSE BY CATEGORY.
        </p>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div className="max-w-2xl">

            <h2 className="home-browse-category-heading font-serif text-4xl leading-[0.95] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              Find artwork that perfectly matches
              your style and space.
            </h2>

          </div>

        </div>
      </div>

      {/* CATEGORY GRID */}

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">

        {categories.map((category) => {

          if (!category.name) {
            return null;
          }

          return (
            <Link
              key={category.id}
              to={`/shop?category=${encodeURIComponent(
                category.name,
              )}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-white/5"
            >

              {/* IMAGE */}

              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    ease-out
                    group-hover:scale-[1.04]
                  "
                />
              ) : (
                <div className="absolute inset-0 bg-white/5" />
              )}

              {/* GRADIENT */}

              <div className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/80
                via-black/20
                to-transparent
              " />

              {/* TEXT */}

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">

                <div className="flex items-end justify-between gap-4">

                  <div>

                    <h3 className="
                      font-serif
                      text-2xl
                      leading-tight
                      text-white
                      sm:text-3xl
                    ">
                      {category.name}
                    </h3>

                    <span className="
                      mt-3
                      inline-flex
                      items-center
                      gap-2
                      border-b
                      border-white
                      pb-1
                      text-xs
                      font-medium
                      uppercase
                      tracking-[0.12em]
                      text-white
                    ">
                      View Collection

                      <ArrowRight
                        size={14}
                        className="
                          transition-transform
                          duration-300
                          group-hover:translate-x-1
                        "
                      />
                    </span>

                  </div>

                </div>

              </div>

            </Link>
          );
        })}

      </div>

    </section>
  );
}