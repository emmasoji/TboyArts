import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";
import ErrorState from "../../../errors/ErrorState";

interface Category {
  id: string;
  name: string | null;
  image: string | null;
  featured: boolean;
  display_order: number;
}

const MAX_CATEGORIES = 4;

export default function BrowseCategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setLoadError(null);
      setError("");

      const { data, error } = await supabase
        .from("categories")
        .select(
          "id, name, image, featured, display_order",
        )
        .order("display_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setCategories(data ?? []);
    } catch (err) {
      console.error(
        "Failed to load categories:",
        err,
      );

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateCategory(
    id: string,
    changes: Partial<Category>,
  ) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id
          ? {
              ...category,
              ...changes,
            }
          : category,
      ),
    );

    setMessage("");
    setError("");
  }

  async function handleImageUpload(
    category: Category,
    file: File,
  ) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    try {
      setUploadingId(category.id);
      setMessage("");
      setError("");

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath = `categories/${category.id}-${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("categories")
          .upload(filePath, file, {
            upsert: true,
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("categories")
        .getPublicUrl(filePath);

      const imageUrl =
        publicUrlData.publicUrl;

      updateCategory(category.id, {
        image: imageUrl,
      });

      const { error: updateError } =
        await supabase
          .from("categories")
          .update({
            image: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id);

      if (updateError) {
        throw updateError;
      }

      setMessage(
        `${category.name || "Category"} image updated.`,
      );
    } catch (err) {
      console.error(
        "Failed to upload category image:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload category image.",
      );
    } finally {
      setUploadingId(null);
    }
  }

  async function handleToggle(
    category: Category,
  ) {
    const currentlyFeatured =
      categories.filter(
        (item) => item.featured,
      );

    if (
      !category.featured &&
      currentlyFeatured.length >= MAX_CATEGORIES
    ) {
      setError(
        "You can display a maximum of 4 categories.",
      );
      return;
    }

    const newFeatured =
      !category.featured;

    let newOrder = category.display_order;

    if (
      newFeatured &&
      currentlyFeatured.length === 0
    ) {
      newOrder = 0;
    }

    if (
      newFeatured &&
      currentlyFeatured.length > 0
    ) {
      newOrder =
        Math.max(
          ...currentlyFeatured.map(
            (item) => item.display_order,
          ),
        ) + 1;
    }

    try {
      setError("");
      setMessage("");

      updateCategory(category.id, {
        featured: newFeatured,
        display_order: newOrder,
      });

      const { error: updateError } =
        await supabase
          .from("categories")
          .update({
            featured: newFeatured,
            display_order: newOrder,
            updated_at: new Date().toISOString(),
          })
          .eq("id", category.id);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error(
        "Failed to update category:",
        err,
      );

      updateCategory(category.id, {
        featured: category.featured,
        display_order:
          category.display_order,
      });

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update category.",
      );
    }
  }

  async function moveCategory(
    category: Category,
    direction: "up" | "down",
  ) {
    const featuredCategories =
      categories
        .filter((item) => item.featured)
        .sort(
          (a, b) =>
            a.display_order -
            b.display_order,
        );

    const index =
      featuredCategories.findIndex(
        (item) => item.id === category.id,
      );

    if (index === -1) return;

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= featuredCategories.length
    ) {
      return;
    }

    const current =
      featuredCategories[index];

    const target =
      featuredCategories[targetIndex];

    try {
      setError("");
      setMessage("");

      updateCategory(current.id, {
        display_order:
          target.display_order,
      });

      updateCategory(target.id, {
        display_order:
          current.display_order,
      });

      const { error } = await supabase
        .from("categories")
        .upsert([
          {
            id: current.id,
            display_order:
              target.display_order,
          },
          {
            id: target.id,
            display_order:
              current.display_order,
          },
        ]);

      if (error) {
        throw error;
      }

      await loadCategories();
    } catch (err) {
      console.error(
        "Failed to reorder categories:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reorder categories.",
      );

      await loadCategories();
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const featuredCategories =
        categories
          .filter(
            (category) =>
              category.featured,
          )
          .sort(
            (a, b) =>
              a.display_order -
              b.display_order,
          )
          .slice(0, MAX_CATEGORIES);

      await Promise.all(
        featuredCategories.map(
          (category, index) =>
            supabase
              .from("categories")
              .update({
                featured: true,
                display_order: index,
                updated_at:
                  new Date().toISOString(),
              })
              .eq("id", category.id),
        ),
      );

      setMessage(
        "Browse categories saved successfully.",
      );

      await loadCategories();
    } catch (err) {
      console.error(
        "Failed to save browse categories:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save browse categories.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(
    category: Category,
  ) {
    try {
      setError("");
      setMessage("");

      const { error } = await supabase
        .from("categories")
        .update({
          image: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", category.id);

      if (error) {
        throw error;
      }

      updateCategory(category.id, {
        image: null,
      });

      setMessage("Category image removed.");
    } catch (err) {
      console.error(
        "Failed to remove category image:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove category image.",
      );
    }
  }

  if (loading) {
    if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load Categories"
        message={
          loadError ||
          "We couldn't load the browse categories. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadCategories();
        }}
      />
    );
  }

  return (
      <section className="w-full">
        <div className="border-b border-[var(--admin-border)] px-6 py-5 sm:px-8">
          <div className="h-3 w-36 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="mt-3 h-6 w-52 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
            >
              <div className="aspect-[4/3] animate-pulse bg-[var(--admin-surface-muted)]" />

              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const featuredCategories =
    categories
      .filter(
        (category) => category.featured,
      )
      .sort(
        (a, b) =>
          a.display_order -
          b.display_order,
      );

  return (
    <section className="w-full">

      {/* HEADER */}

      <div className="border-b border-white/5 px-6 py-5 sm:px-8">
        <div className="flex items-start justify-between gap-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
              Browse Categories
            </p>

            <h3 className="mt-1 text-xl font-medium text-white/90">
              Homepage Categories
            </h3>

            <p className="mt-1 max-w-xl text-sm text-white/35">
              Choose up to 4 categories for the
              homepage. Each category uses its
              own manually uploaded image.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/40">
            {featuredCategories.length}/4
          </span>

        </div>
      </div>

      <div className="p-6 sm:p-8">

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {/* AVAILABLE CATEGORIES */}

        <div className="space-y-3">

          {categories.map((category) => {
            const selected =
              category.featured;

            const featuredIndex =
              featuredCategories.findIndex(
                (item) =>
                  item.id === category.id,
              );

            return (
              <div
                key={category.id}
                className={`
                  overflow-hidden
                  rounded-2xl
                  border
                  transition
                  ${
                    selected
                      ? "border-white/15 bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.015]"
                  }
                `}
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">

                  {/* IMAGE */}

                  <label
                    className="
                      relative
                      h-24
                      w-full
                      shrink-0
                      cursor-pointer
                      overflow-hidden
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.03]
                      sm:h-24
                      sm:w-32
                    "
                  >
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={
                          category.name ??
                          "Category"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/25">
                        <ImageIcon size={22} />
                        <span className="text-[10px] uppercase tracking-wider">
                          Add Image
                        </span>
                      </div>
                    )}

                    {uploadingId ===
                      category.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Loader2
                          size={20}
                          className="animate-spin text-white"
                        />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={
                        uploadingId ===
                        category.id
                      }
                      onChange={(event) => {
                        const file =
                          event.target.files?.[0];

                        if (file) {
                          handleImageUpload(
                            category,
                            file,
                          );
                        }

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {/* INFO */}

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-white/80">
                      {category.name ||
                        "Unnamed Category"}
                    </h4>

                    <p className="mt-1 text-xs text-white/30">
                      {selected
                        ? `Homepage position ${
                            featuredIndex + 1
                          }`
                        : "Not displayed on homepage"}
                    </p>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex items-center gap-2">

                    {selected && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            moveCategory(
                              category,
                              "up",
                            )
                          }
                          disabled={
                            featuredIndex ===
                            0
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                          title="Move up"
                        >
                          ↑
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            moveCategory(
                              category,
                              "down",
                            )
                          }
                          disabled={
                            featuredIndex ===
                            featuredCategories.length -
                              1
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                          title="Move down"
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              category,
                            )
                          }
                          disabled={
                            !category.image
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/30 transition hover:bg-white/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                          title="Remove image"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleToggle(
                          category,
                        )
                      }
                      className={`
                        flex
                        h-9
                        items-center
                        gap-2
                        rounded-lg
                        px-3
                        text-xs
                        font-medium
                        transition
                        ${
                          selected
                            ? "bg-white text-black hover:bg-white/90"
                            : "border border-white/10 text-white/45 hover:bg-white/5 hover:text-white"
                        }
                      `}
                    >
                      {selected ? (
                        <>
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Add</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* SAVE */}

        <div className="mt-6 flex justify-end border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            {saving
              ? "Saving..."
              : "Save Categories"}
          </button>
        </div>

      </div>
    </section>
  );
}
