import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import { supabase } from "../../../lib/supabase";

interface Philosophy {
  id: string;
  title: string;
  description: string;
  sort_order: number;
}

const DEFAULT_ITEMS = [
  {
    title: "Emotion",
    description:
      "Every artwork begins with a feeling. The goal is to create something that connects beyond appearance.",
  },
  {
    title: "Story",
    description:
      "Each piece carries a narrative, allowing viewers to discover their own meaning within the artwork.",
  },
  {
    title: "Expression",
    description:
      "Colour, texture and form become tools to transform imagination into something tangible.",
  },
  {
    title: "Craftsmanship",
    description:
      "Every detail is carefully considered, from the first idea to the final brushstroke.",
  },
];

export default function PhilosophyManagement() {
  const [items, setItems] = useState<Philosophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    loadPhilosophy();
  }, []);

  async function loadPhilosophy() {
    try {
      setLoading(true);
      setError("");
      setLoadError(null);

      const { data, error } = await supabase
        .from("artist_philosophy")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setItems(data as Philosophy[]);
      } else {
        setItems(
          DEFAULT_ITEMS.map((item, index) => ({
            id: `new-${index}`,
            ...item,
            sort_order: index,
          })),
        );
      }
    } catch (err) {
      console.error(
        "Failed to load philosophy:",
        err,
      );

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load philosophy.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    index: number,
    field: "title" | "description",
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    );
  }

  async function savePhilosophy() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const { error: deleteError } = await supabase
        .from("artist_philosophy")
        .delete()
        .not("id", "is", null);

      if (deleteError) throw deleteError;

      const payload = items.map((item, index) => ({
        title: item.title,
        description: item.description,
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from("artist_philosophy")
        .insert(payload);

      if (insertError) throw insertError;

      setMessage("Philosophy saved successfully.");

      await loadPhilosophy();
    } catch (err) {
      console.error(
        "Failed to save philosophy:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save philosophy.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="h-8 w-36 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
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
        title="Unable to Load Philosophy"
        message={
          loadError ||
          "We couldn't load the philosophy management data. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadPhilosophy();
        }}
      />
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111113] p-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Artist Page
        </p>

        <h3 className="font-serif text-2xl">
          Philosophy
        </h3>

        <p className="mt-2 text-sm text-white/40">
          Manage the ideas and principles behind
          the artwork.
        </p>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs text-white/25">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                Philosophy point
              </span>
            </div>

            <input
              type="text"
              value={item.title}
              onChange={(event) =>
                updateItem(
                  index,
                  "title",
                  event.target.value,
                )
              }
              placeholder="Title"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
            />

            <textarea
              value={item.description}
              onChange={(event) =>
                updateItem(
                  index,
                  "description",
                  event.target.value,
                )
              }
              placeholder="Description"
              rows={4}
              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-white/25"
            />
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
          onClick={savePhilosophy}
          disabled={saving}
          className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Philosophy"}
        </button>
      </div>
    </div>
  );
}
