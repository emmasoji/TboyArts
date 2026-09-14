import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ArtworkCard from "../components/artwork/ArtworkCard";
import ArtworkModal from "../components/artwork/ArtworkModal";
import ImagePreviewModal from "../components/artwork/ImagePreviewModal";

import { getArtworks } from "../services/artworkService";
import type { Artwork as ServiceArtwork } from "../services/artworkService";

import type { Artwork as CardArtwork } from "../types/artwork";
import { useCart } from "../contexts/CartContext";
import ShopSkeleton from "../components/ui/ShopSkeleton";
import ErrorState from "../components/errors/ErrorState";
import SEO from "../components/seo/SEO";

type SortOption =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high";

export default function Shop() {
  const [searchParams] = useSearchParams();

  const shopTitle = "Shop Contemporary Art — TboyArts";
  const shopDescription =
    "Browse original contemporary artwork from TboyArts, including available paintings and selected works.";


  const categoryFilter =
    searchParams.get("category") ?? "all";

  const artworkParam =
    searchParams.get("artwork");

  const [sort, setSort] =
    useState<SortOption>("featured");

  const [artworks, setArtworks] =
    useState<ServiceArtwork[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedArtwork, setSelectedArtwork] =
    useState<CardArtwork | null>(null);

  const [previewArtwork, setPreviewArtwork] =
    useState<CardArtwork | null>(null);

  /*
   * LOAD ARTWORKS FROM SUPABASE
   */
  const loadArtworks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getArtworks();

      setArtworks(data);
    } catch (err) {
      console.error(
        "Failed to load artworks:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load artworks.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtworks();
  }, []);

  /*
   * OPEN ARTWORK FROM URL
   *
   * Supports:
   * /shop?artwork=ARTWORK_ID
   * /shop?artwork=ARTWORK_SLUG
   */
  useEffect(() => {
    if (!artworkParam || artworks.length === 0) {
      return;
    }

    const artwork = artworks.find(
      (item) =>
        item.id === artworkParam ||
        item.slug === artworkParam,
    );

    if (artwork) {
      setSelectedArtwork(
        toCardArtwork(artwork),
      );
    }
  }, [artworkParam, artworks]);

  /*
   * CATEGORY LIST
   */
  const categories = useMemo(() => {
    return Array.from(
      new Set(
        artworks
          .map((artwork) =>
            artwork.category?.trim(),
          )
          .filter(
            (category): category is string =>
              Boolean(category),
          ),
      ),
    );
  }, [artworks]);

  /*
   * FILTER + SORT
   */
  const sortedArtworks = useMemo(() => {
    let result = [...artworks];

    /*
     * CATEGORY FILTER
     */
    if (categoryFilter !== "all") {
      result = result.filter(
        (artwork) =>
          artwork.category?.trim().toLowerCase() ===
          categoryFilter.trim().toLowerCase(),
      );
    }

    /*
     * SORT
     */
    switch (sort) {
      case "newest":
        return result.sort(
          (a, b) =>
            (b.year ?? 0) -
            (a.year ?? 0),
        );

      case "price-low":
        return result.sort(
          (a, b) =>
            (a.price ?? 0) -
            (b.price ?? 0),
        );

      case "price-high":
        return result.sort(
          (a, b) =>
            (b.price ?? 0) -
            (a.price ?? 0),
        );

      case "featured":
      default:
        return result.sort(
          (a, b) =>
            Number(Boolean(b.featured)) -
            Number(Boolean(a.featured)),
        );
    }
  }, [artworks, categoryFilter, sort]);

  /*
   * Convert Supabase artwork shape
   * into the existing ArtworkCard shape.
   */
  function toCardArtwork(
    artwork: ServiceArtwork,
  ): CardArtwork {
    return {
      id: artwork.id,
      title: artwork.title ?? "",
      image: artwork.image ?? "",
      price: artwork.price ?? 0,
      description:
        artwork.description ?? "",
      dimensions:
        artwork.dimensions ?? "",
      year: artwork.year ?? 0,
      status:
        artwork.status === "sold"
          ? "sold"
          : artwork.status === "view-only"
            ? "view-only"
            : "available",
      featured:
        Boolean(artwork.featured),
      category:
        artwork.category ?? undefined,
      slug:
        artwork.slug ?? undefined,
    };
  }

  /*
   * ADD TO CART
   */
  const { addToCart } = useCart();

  const handleAddToCart = (
    artwork: CardArtwork,
  ) => {
    addToCart({
      id: artwork.id,
      title: artwork.title,
      image: artwork.image,
      price: artwork.price,
      description: artwork.description,
      dimensions: artwork.dimensions,
      year: artwork.year,
      category: artwork.category,
      slug: artwork.slug,
    });
  };

  return (
    <>
      <SEO
        title={shopTitle}
        description={shopDescription}
      />
      <Navbar />
      <main className="shop-page">

      {/* PAGE-LEVEL ERROR */}

      {error ? (
        <ErrorState
          type="server"
          fullPage
          title="Unable to Load Artworks"
          message={
            error ||
            "We couldn't load the artwork collection right now. Please try again."
          }
          actionLabel="Try Again"
          onAction={loadArtworks}
        />
      ) : (
        <>
          {/* SHOP HEADER */}

          <section className="shop-header tboyarts-slide-in-left">

            <div>

              <h1>
                GALLERY
              </h1>

              <p className="shop-description">
                Explore the current collection of
                original works by TboyArts.
              </p>

            </div>

            <div className="shop-controls">

              {/* CATEGORY FILTER */}

              <div className="shop-filter">

                <label htmlFor="artwork-category">
                  Category
                </label>

                <select
                  id="artwork-category"
                  value={categoryFilter}
                  onChange={(event) => {
                    const category =
                      event.target.value;

                    if (category === "all") {
                      window.history.pushState(
                        {},
                        "",
                        "/shop",
                      );

                      window.dispatchEvent(
                        new PopStateEvent(
                          "popstate",
                        ),
                      );
                    } else {
                      window.history.pushState(
                        {},
                        "",
                        `/shop?category=${encodeURIComponent(
                          category,
                        )}`,
                      );

                      window.dispatchEvent(
                        new PopStateEvent(
                          "popstate",
                        ),
                      );
                    }
                  }}
                >

                  <option value="all">
                    All Artwork
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}

                </select>

              </div>

              {/* SORT */}

              <div className="shop-filter">

                <label htmlFor="artwork-sort">
                  Sort
                </label>

                <select
                  id="artwork-sort"
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value as SortOption,
                    )
                  }
                >

                  <option value="featured">
                    Featured
                  </option>

                  <option value="newest">
                    Newest
                  </option>

                  <option value="price-low">
                    Price: Low to high
                  </option>

                  <option value="price-high">
                    Price: High to low
                  </option>

                </select>

              </div>

            </div>

          </section>

          {/* ARTWORK GRID */}

          <section
            className={`artwork-grid ${
              loading ? "" : "tboyarts-slide-in-left"
            }`}
          >

            {loading ? (
              <ShopSkeleton />
            ) : sortedArtworks.length === 0 ? (

              <div className="shop-empty">
                <h2>
                  No artwork found.
                </h2>

                <p>
                  There are currently no artworks
                  in this category.
                </p>
              </div>

            ) : (

              sortedArtworks.map(
                (artwork) => {

                  if (!artwork.image) {
                    return null;
                  }

                  const cardArtwork =
                    toCardArtwork(artwork);

                  return (
                    <ArtworkCard
                      key={artwork.id}
                      artwork={cardArtwork}

                      onImageSelect={
                        setPreviewArtwork
                      }

                      onSelect={
                        setSelectedArtwork
                      }
                    />
                  );
                },
              )

            )}

          </section>
        </>
      )}

      {/* IMAGE PREVIEW */}

      <ImagePreviewModal
        artwork={previewArtwork}
        onClose={() =>
          setPreviewArtwork(null)
        }
      />

      {/* ARTWORK DETAILS */}

      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() =>
          setSelectedArtwork(null)
        }
        onAddToCart={handleAddToCart}
      />

    </main>
      <Footer />
    </>
  );
}
