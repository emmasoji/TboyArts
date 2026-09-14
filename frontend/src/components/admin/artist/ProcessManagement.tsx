import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import { supabase } from "../../../lib/supabase";

interface ProcessItem {
  id?: string;
  title: string;
  description: string;
  image: string;
  sort_order: number;
}

const defaultItems: ProcessItem[] = [
  {
    title: "Inspiration",
    description:
      "Every artwork begins with an idea, emotion, or moment that sparks creativity.",
    image: "",
    sort_order: 1,
  },
  {
    title: "Sketching",
    description:
      "Ideas are refined through planning, composition and exploring visual possibilities.",
    image: "",
    sort_order: 2,
  },
  {
    title: "Creation",
    description:
      "Colours, textures, and techniques come together as the artwork takes shape.",
    image: "",
    sort_order: 3,
  },
  {
    title: "Final Artwork",
    description:
      "The finished piece represents the journey from imagination to reality.",
    image: "",
    sort_order: 4,
  },
];

export default function ProcessManagement() {
  const [items, setItems] =
    useState<ProcessItem[]>(defaultItems);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    loadProcess();
  }, []);

  async function loadProcess() {
    try {
      setLoading(true);
      setError("");
      setLoadError(null);

      const { data, error } = await supabase
        .from("artist_process")
        .select("*")
        .order("sort_order", {
          ascending: true,
        });

      if (error) throw error;

      if (data && data.length > 0) {
        setItems(data);
      }
    } catch (err) {
      console.error(
        "Failed to load artist process:",
        err,
      );

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load process.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    index: number,
    field: keyof ProcessItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  async function saveProcess() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      for (const item of items) {
        if (item.id) {
          const { error } = await supabase
            .from("artist_process")
            .update({
              title: item.title,
              description: item.description,
              image: item.image || null,
              sort_order: item.sort_order,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("artist_process")
            .insert({
              title: item.title,
              description: item.description,
              image: item.image || null,
              sort_order: item.sort_order,
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            item.id = data.id;
          }
        }
      }

      setMessage("Process saved successfully.");
      await loadProcess();
    } catch (err) {
      console.error(
        "Failed to save artist process:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save process.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 sm:p-8">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="h-8 w-40 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5"
            >
              <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              <div className="mt-4 h-28 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
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
        title="Unable to Load Artist Process"
        message={
          loadError ||
          "We couldn't load the artist process management data. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadProcess();
        }}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111113] p-6 sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Artist
        </p>

        <h3 className="font-serif text-2xl text-white sm:text-3xl">
          The Process
        </h3>

        <p className="mt-2 text-sm text-white/40">
          Manage the journey from idea to final artwork.
        </p>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={item.id ?? index}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-xs text-white/50">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                Process Step
              </span>
            </div>

            <div className="grid gap-4">
              <input
                value={item.title}
                onChange={(e) =>
                  updateItem(
                    index,
                    "title",
                    e.target.value,
                  )
                }
                placeholder="Step title"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              />

              <textarea
                value={item.description}
                onChange={(e) =>
                  updateItem(
                    index,
                    "description",
                    e.target.value,
                  )
                }
                rows={3}
                placeholder="Step description"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              />

              <input
                value={item.image}
                onChange={(e) =>
                  updateItem(
                    index,
                    "image",
                    e.target.value,
                  )
                }
                placeholder="Image URL (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              />
            </div>
          </div>
        ))}
      </div>

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
          onClick={saveProcess}
          disabled={saving}
          className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Process"}
        </button>
      </div>
    </div>
  );
}
