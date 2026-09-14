import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import { supabase } from "../../../lib/supabase";

interface Artwork {
  id: string;
  title: string | null;
  category: string | null;
  image: string | null;
  featured: boolean | null;
}

export default function SelectedWorksManagement() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  async function loadArtworks() {
    try {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("artworks")
        .select("id, title, category, image, featured")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const items = (data ?? []) as Artwork[];

      setArtworks(items);

      setSelected(
        items
          .filter((artwork) => artwork.featured)
          .slice(0, 4)
          .map((artwork) => artwork.id),
      );
    } catch (err) {
      console.error(err);

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load artworks.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleArtwork(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, id];
    });
  }

  async function saveSelection() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      for (const artwork of artworks) {
        const shouldBeFeatured =
          selected.includes(artwork.id);

        const { error } = await supabase
          .from("artworks")
          .update({
            featured: shouldBeFeatured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", artwork.id);

        if (error) throw error;
      }

      setMessage("Selected works saved successfully.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save selected works.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 sm:p-8">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="h-8 w-44 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)]"
            >
              <div className="aspect-[4/3] animate-pulse bg-[var(--admin-surface-muted)]" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load Selected Works"
        message={
          loadError ||
          "We couldn't load the artworks for the Selected Works section. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadArtworks();
        }}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111113] p-6 sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Exhibition
        </p>

        <h3 className="font-serif text-2xl text-white sm:text-3xl">
          Selected Works
        </h3>

        <p className="mt-2 text-sm text-white/40">
          Choose up to four artworks to display on the
          Artist page.
        </p>

        <p className="mt-3 text-xs text-white/30">
          {selected.length} of 4 selected
        </p>
      </div>

      {artworks.length === 0 ? (
        <p className="text-sm text-white/40">
          No artworks found.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artworks.map((artwork) => {
            const active = selected.includes(artwork.id);

            return (
              <button
                key={artwork.id}
                type="button"
                onClick={() =>
                  toggleArtwork(artwork.id)
                }
                className={`group overflow-hidden rounded-2xl border text-left transition ${
                  active
                    ? "border-white/40 bg-white/[0.08]"
                    : "border-white/5 bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {artwork.image ? (
                    <img
                      src={artwork.image}
                      alt={artwork.title ?? "Artwork"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5 text-xs text-white/30">
                      No image
                    </div>
                  )}

                  {active && (
                    <div className="absolute inset-0 flex items-start justify-end bg-black/20 p-3">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
                        Selected
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h4 className="truncate text-sm font-medium text-white">
                    {artwork.title ?? "Untitled"}
                  </h4>

                  <p className="mt-1 truncate text-xs text-white/35">
                    {artwork.category ?? "Artwork"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {(message || error) && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/5 text-red-300"
              : "border-green-500/20 bg-green-500/5 text-green-300"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="mt-8 flex justify-end border-t border-white/5 pt-6">
        <button
          type="button"
          onClick={saveSelection}
          disabled={saving}
          className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Selected Works"}
        </button>
      </div>
    </div>
  );
}
