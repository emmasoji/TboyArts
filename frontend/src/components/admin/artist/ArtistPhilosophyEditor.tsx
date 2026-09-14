import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import {
  getArtistPhilosophy,
  saveArtistPhilosophy,
  deleteArtistPhilosophy,
  type ArtistPhilosophy,
} from "../../../services/artistService";

const defaultItems = [
  {
    title: "Emotion",
    description:
      "Every artwork begins with a feeling. The goal is to create something that connects beyond appearance.",
    sort_order: 0,
  },
  {
    title: "Story",
    description:
      "Each piece carries a narrative, allowing viewers to discover their own meaning within the artwork.",
    sort_order: 1,
  },
  {
    title: "Expression",
    description:
      "Colour, texture and form become tools to transform imagination into something tangible.",
    sort_order: 2,
  },
  {
    title: "Craftsmanship",
    description:
      "Every detail is carefully considered, from the first idea to the final brushstroke.",
    sort_order: 3,
  },
];

export default function ArtistPhilosophyEditor() {
  const [items, setItems] = useState<
    ArtistPhilosophy[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      setMessage("");
      setLoadError(null);

      const data =
        await getArtistPhilosophy();

      /*
       * If the table is empty, show the
       * requested default philosophy items.
       */
      if (data.length === 0) {
        setItems(
          defaultItems.map((item) => ({
            ...item,
            id: `new-${item.sort_order}`,
            created_at: "",
            updated_at: "",
          })),
        );
      } else {
        setItems(data);
      }
    } catch (error) {
      console.error(
        "Failed to load philosophy:",
        error,
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load philosophy.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    id: string,
    field: "title" | "description",
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function moveItem(
    index: number,
    direction: "up" | "down",
  ) {
    const newIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >= items.length
    ) {
      return;
    }

    const next = [...items];

    const [moved] = next.splice(
      index,
      1,
    );

    next.splice(newIndex, 0, moved);

    setItems(
      next.map((item, itemIndex) => ({
        ...item,
        sort_order: itemIndex,
      })),
    );
  }

  async function handleSave(
    item: ArtistPhilosophy,
  ) {
    try {
      setSaving(item.id);
      setMessage("");

      await saveArtistPhilosophy({
        ...(item.id.startsWith("new-")
          ? {}
          : { id: item.id }),
        title: item.title,
        description: item.description,
        sort_order: item.sort_order,
      });

      setMessage(
        `"${item.title}" saved successfully.`,
      );

      await loadItems();
    } catch (error) {
      console.error(
        "Failed to save philosophy:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save philosophy.",
      );
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(
    item: ArtistPhilosophy,
  ) {
    if (item.id.startsWith("new-")) {
      setItems((current) =>
        current.filter(
          (entry) =>
            entry.id !== item.id,
        ),
      );

      return;
    }

    try {
      setSaving(item.id);
      setMessage("");

      await deleteArtistPhilosophy(
        item.id,
      );

      setItems((current) =>
        current.filter(
          (entry) =>
            entry.id !== item.id,
        ),
      );

      setMessage(
        `"${item.title}" deleted.`,
      );
    } catch (error) {
      console.error(
        "Failed to delete philosophy:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete philosophy.",
      );
    } finally {
      setSaving(null);
    }
  }

  function addItem() {
    const id =
      `new-${Date.now()}`;

    setItems((current) => [
      ...current,
      {
        id,
        title: "",
        description: "",
        sort_order: current.length,
        created_at: "",
        updated_at: "",
      },
    ]);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={index}
            className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--admin-surface-muted)]" />
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
              </div>

              <div className="h-8 w-16 animate-pulse rounded-lg bg-[var(--admin-surface-muted)]" />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-32 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>

              <div className="h-10 w-28 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
            </div>
          </article>
        ))}
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
          "We couldn't load the artist philosophy. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadItems();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.02]
            p-5
            sm:p-6
          "
        >
          {/* HEADER */}

          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-white/40">
                {String(index + 1).padStart(
                  2,
                  "0",
                )}
              </span>

              <span className="text-xs uppercase tracking-[0.15em] text-white/35">
                Philosophy Item
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  moveItem(index, "up")
                }
                disabled={index === 0}
                className="
                  rounded-lg
                  px-2
                  py-1
                  text-white/40
                  transition
                  hover:bg-white/5
                  hover:text-white
                  disabled:opacity-20
                "
                aria-label="Move up"
              >
                ↑
              </button>

              <button
                type="button"
                onClick={() =>
                  moveItem(index, "down")
                }
                disabled={
                  index ===
                  items.length - 1
                }
                className="
                  rounded-lg
                  px-2
                  py-1
                  text-white/40
                  transition
                  hover:bg-white/5
                  hover:text-white
                  disabled:opacity-20
                "
                aria-label="Move down"
              >
                ↓
              </button>
            </div>
          </div>

          {/* TITLE */}

          <label className="mb-5 block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/40">
              Title
            </span>

            <input
              value={item.title}
              onChange={(event) =>
                updateItem(
                  item.id,
                  "title",
                  event.target.value,
                )
              }
              placeholder="Emotion"
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                px-4
                py-3
                text-sm
                text-white
                outline-none
                placeholder:text-white/20
                focus:border-white/25
              "
            />
          </label>

          {/* DESCRIPTION */}

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.15em] text-white/40">
              Description
            </span>

            <textarea
              value={item.description}
              onChange={(event) =>
                updateItem(
                  item.id,
                  "description",
                  event.target.value,
                )
              }
              rows={4}
              placeholder="Describe this philosophy..."
              className="
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                px-4
                py-3
                text-sm
                leading-7
                text-white
                outline-none
                placeholder:text-white/20
                focus:border-white/25
              "
            />
          </label>

          {/* ACTIONS */}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                handleSave(item)
              }
              disabled={
                saving === item.id
              }
              className="
                rounded-xl
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-black
                transition
                hover:bg-white/90
                disabled:opacity-50
              "
            >
              {saving === item.id
                ? "Saving..."
                : "Save"}
            </button>

            <button
              type="button"
              onClick={() =>
                handleDelete(item)
              }
              disabled={
                saving === item.id
              }
              className="
                rounded-xl
                border
                border-red-500/20
                px-4
                py-2.5
                text-sm
                text-red-300/70
                transition
                hover:bg-red-500/10
                hover:text-red-300
                disabled:opacity-50
              "
            >
              Delete
            </button>
          </div>
        </article>
      ))}

      {/* ADD */}

      <button
        type="button"
        onClick={addItem}
        className="
          w-full
          rounded-2xl
          border
          border-dashed
          border-white/10
          bg-white/[0.02]
          px-5
          py-5
          text-sm
          text-white/40
          transition
          hover:border-white/20
          hover:bg-white/[0.04]
          hover:text-white
        "
      >
        + Add Philosophy Item
      </button>

      {message && (
        <p className="text-sm text-white/50">
          {message}
        </p>
      )}
    </div>
  );
}
