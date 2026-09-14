import { useEffect, useState } from "react";
import {
  ChevronDown,
  MoreVertical,
  Plus,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";
import TaxonomyModal from "./TaxonomyModal";
import ErrorState from "../../../errors/ErrorState";

type TaxonomyType = "category" | "medium";

interface TaxonomyItem {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string | null;
}

export default function CategoryMediumPanel() {
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [mediumOpen, setMediumOpen] = useState(true);

  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [mediums, setMediums] = useState<TaxonomyItem[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMediums, setLoadingMediums] = useState(true);

  const [categoryError, setCategoryError] =
    useState<string | null>(null);

  const [mediumError, setMediumError] =
    useState<string | null>(null);

  const [modalType, setModalType] =
    useState<TaxonomyType | null>(null);

  const [editingItem, setEditingItem] =
    useState<TaxonomyItem | null>(null);

  useEffect(() => {
    loadCategories();
    loadMediums();
  }, []);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      setCategoryError(null);

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, created_at, updated_at")
        .order("display_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      setCategories(data ?? []);
    } catch (error) {
      console.error(
        "Failed to load categories:",
        error,
      );

      setCategoryError(
        error instanceof Error
          ? error.message
          : "Failed to load categories.",
      );
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadMediums() {
    try {
      setLoadingMediums(true);
      setMediumError(null);

      const { data, error } = await supabase
        .from("mediums")
        .select("id, name, created_at, updated_at")
        .order("created_at", {
          ascending: true,
        });

      if (error) throw error;

      setMediums(data ?? []);
    } catch (error) {
      console.error(
        "Failed to load mediums:",
        error,
      );

      setMediumError(
        error instanceof Error
          ? error.message
          : "Failed to load mediums.",
      );
    } finally {
      setLoadingMediums(false);
    }
  }

  function openAdd(type: TaxonomyType) {
    setEditingItem(null);
    setModalType(type);
  }

  function openEdit(
    type: TaxonomyType,
    item: TaxonomyItem,
  ) {
    setEditingItem(item);
    setModalType(type);
  }

  async function handleSave(name: string) {
    if (!modalType) return;

    try {
      const table =
        modalType === "category"
          ? "categories"
          : "mediums";

      if (editingItem) {
        const { error } = await supabase
          .from(table)
          .update({
            name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({
            name,
          });

        if (error) throw error;
      }

      if (modalType === "category") {
        await loadCategories();
      } else {
        await loadMediums();
      }

      setModalType(null);
      setEditingItem(null);
    } catch (error) {
      console.error(
        "Failed to save taxonomy:",
        error,
      );

      alert(
        `Failed to save ${modalType}.`,
      );
    }
  }

  async function handleDelete(
    type: TaxonomyType,
    id: string,
  ) {
    const confirmed = window.confirm(
      `Delete this ${type}?`,
    );

    if (!confirmed) return;

    try {
      const table =
        type === "category"
          ? "categories"
          : "mediums";

      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (error) throw error;

      if (type === "category") {
        setCategories((current) =>
          current.filter(
            (item) => item.id !== id,
          ),
        );
      } else {
        setMediums((current) =>
          current.filter(
            (item) => item.id !== id,
          ),
        );
      }
    } catch (error) {
      console.error(
        `Failed to delete ${type}:`,
        error,
      );

      alert(
        `Failed to delete ${type}.`,
      );
    }
  }

  return (
    <>
      <div className="min-w-0 w-full max-w-full space-y-4">

        {/* CATEGORIES */}

        <section className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <button
              type="button"
              onClick={() =>
                setCategoryOpen(
                  (current) => !current,
                )
              }
              className="flex items-center gap-3"
            >
              <ChevronDown
                size={18}
                className={`
                  transition-transform
                  ${
                    categoryOpen
                      ? "rotate-0"
                      : "-rotate-90"
                  }
                `}
              />

              <div className="text-left">
                <h3 className="text-sm font-medium">
                  Categories
                </h3>

                <p className="mt-1 text-xs text-white/30">
                  Manage artwork categories.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                openAdd("category")
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                bg-white
                text-black
                transition
                hover:bg-white/90
              "
            >
              <Plus size={17} />
            </button>

          </div>

          {categoryOpen && (
            <div className="divide-y divide-white/5">

              {loadingCategories ? (

                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">
                    Loading categories...
                  </p>
                </div>

              ) : categoryError ? (

                <ErrorState
                  type="network"
                  title="Unable to Load Categories"
                  message={
                    categoryError ||
                    "We couldn't load the artwork categories. Please try again."
                  }
                  actionLabel="Try Again"
                  onAction={() => {
                    void loadCategories();
                  }}
                />

              ) : categories.length === 0 ? (

                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">
                    No categories yet.
                  </p>
                </div>

              ) : (

                categories.map((item) => (
                  <div
                    key={item.id}
                    className="
                      flex
                      items-center
                      justify-between
                      px-5
                      py-4
                    "
                  >
                    <span className="text-sm text-white/70">
                      {item.name}
                    </span>

                    <div className="group relative">

                      <button
                        type="button"
                        className="
                          flex h-9 w-9
                          items-center justify-center
                          rounded-lg
                          text-white/35
                          transition
                          hover:bg-white/10
                          hover:text-white
                        "
                      >
                        <MoreVertical
                          size={18}
                        />
                      </button>

                      <div
                        className="
                          invisible
                          absolute
                          right-0
                          top-10
                          z-10
                          w-28
                          overflow-hidden
                          rounded-xl
                          border
                          border-white/10
                          bg-[#171719]
                          opacity-0
                          shadow-xl
                          transition
                          group-focus-within:visible
                          group-focus-within:opacity-100
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              "category",
                              item,
                            )
                          }
                          className="
                            block
                            w-full
                            px-4
                            py-2.5
                            text-left
                            text-xs
                            text-white/60
                            hover:bg-white/5
                            hover:text-white
                          "
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              "category",
                              item.id,
                            )
                          }
                          className="
                            block
                            w-full
                            px-4
                            py-2.5
                            text-left
                            text-xs
                            text-red-400/70
                            hover:bg-red-400/5
                          "
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                ))

              )}

            </div>
          )}

        </section>

        {/* MEDIUM */}

        <section className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

            <button
              type="button"
              onClick={() =>
                setMediumOpen(
                  (current) => !current,
                )
              }
              className="flex items-center gap-3"
            >
              <ChevronDown
                size={18}
                className={`
                  transition-transform
                  ${
                    mediumOpen
                      ? "rotate-0"
                      : "-rotate-90"
                  }
                `}
              />

              <div className="text-left">
                <h3 className="text-sm font-medium">
                  Medium
                </h3>

                <p className="mt-1 text-xs text-white/30">
                  Manage artwork mediums.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                openAdd("medium")
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                bg-white
                text-black
                transition
                hover:bg-white/90
              "
            >
              <Plus size={17} />
            </button>

          </div>

          {mediumOpen && (
            <div className="divide-y divide-white/5">

              {loadingMediums ? (

                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">
                    Loading mediums...
                  </p>
                </div>

              ) : mediumError ? (

                <ErrorState
                  type="network"
                  title="Unable to Load Mediums"
                  message={
                    mediumError ||
                    "We couldn't load the artwork mediums. Please try again."
                  }
                  actionLabel="Try Again"
                  onAction={() => {
                    void loadMediums();
                  }}
                />

              ) : mediums.length === 0 ? (

                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-white/30">
                    No mediums yet.
                  </p>
                </div>

              ) : (

                mediums.map((item) => (
                  <div
                    key={item.id}
                    className="
                      flex
                      items-center
                      justify-between
                      px-5
                      py-4
                    "
                  >
                    <span className="text-sm text-white/70">
                      {item.name}
                    </span>

                    <div className="group relative">

                      <button
                        type="button"
                        className="
                          flex h-9 w-9
                          items-center justify-center
                          rounded-lg
                          text-white/35
                          transition
                          hover:bg-white/10
                          hover:text-white
                        "
                      >
                        <MoreVertical
                          size={18}
                        />
                      </button>

                      <div
                        className="
                          invisible
                          absolute
                          right-0
                          top-10
                          z-10
                          w-28
                          overflow-hidden
                          rounded-xl
                          border
                          border-white/10
                          bg-[#171719]
                          opacity-0
                          shadow-xl
                          transition
                          group-focus-within:visible
                          group-focus-within:opacity-100
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              "medium",
                              item,
                            )
                          }
                          className="
                            block
                            w-full
                            px-4
                            py-2.5
                            text-left
                            text-xs
                            text-white/60
                            hover:bg-white/5
                            hover:text-white
                          "
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              "medium",
                              item.id,
                            )
                          }
                          className="
                            block
                            w-full
                            px-4
                            py-2.5
                            text-left
                            text-xs
                            text-red-400/70
                            hover:bg-red-400/5
                          "
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                ))

              )}

            </div>
          )}

        </section>

      </div>

      {/* ADD / EDIT MODAL */}

      {modalType && (
        <TaxonomyModal
          type={modalType}
          initialName={
            editingItem?.name ?? ""
          }
          onClose={() => {
            setModalType(null);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </>
  );
}