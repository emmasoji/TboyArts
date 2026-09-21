import { useAdminTheme } from "../../../../contexts/AdminThemeContext";
import { useEffect, useState } from "react";

import {
  Plus,
  MoreVertical,
  Star,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  Link,
} from "lucide-react";

import {
  createArtwork,
  deleteArtwork,
  getArtworks,
  updateArtwork,
} from "../../../../services/artworkService";

import type {
  Artwork,
} from "../../../../services/artworkService";

import AddArtworkModal from "../AddArtworkModal";
import EditArtworkModal from "../EditArtworkModal";
import DeleteArtworkModal from "./DeleteArtworkModal";
import ErrorState from "../../../errors/ErrorState";

import { createPortal } from "react-dom";
import { supabase } from "../../../../lib/supabase";
import API_URL from "../../../../config/api";

import type {
  ArtworkFormData,
} from "../ArtworkFormModal";

export default function ArtworkTable() {
  const { theme } = useAdminTheme();
  const isLight = theme === "light";
  const [artworks, setArtworks] =
    useState<Artwork[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editingArtwork, setEditingArtwork] =
    useState<Artwork | null>(null);

  const [selectedArtwork, setSelectedArtwork] =
    useState<Artwork | null>(null);

  const [deletingArtwork, setDeletingArtwork] =
    useState<Artwork | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const [featuredError, setFeaturedError] =
    useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 10;

  /*
   * LOAD ARTWORKS
   */

  useEffect(() => {
    loadArtworks();
  }, []);

  async function loadArtworks() {
    try {
      setLoading(true);
      setError(null);

      const data = await getArtworks();

      setArtworks(data);
    } catch (err) {
      console.error(
        "Failed to load artworks:",
        err,
      );

      setError(
        "Unable to load artworks.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * CATEGORIES
   */

  const categories = Array.from(
    new Set(
      artworks
        .map((artwork) =>
          artwork.category?.trim(),
        )
        .filter(
          (
            category,
          ): category is string =>
            Boolean(category),
        ),
    ),
  );

  /*
   * FILTER
   */

  const filteredArtworks =
    selectedCategory === "all"
      ? artworks
      : artworks.filter(
          (artwork) =>
            artwork.category?.trim() ===
            selectedCategory,
        );

  /*
   * PAGINATION
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredArtworks.length /
        itemsPerPage,
    ),
  );

  const startIndex =
    (currentPage - 1) *
    itemsPerPage;

  const currentArtworks =
    filteredArtworks.slice(
      startIndex,
      startIndex + itemsPerPage,
    );

  /*
   * UPLOAD ARTWORK IMAGE
   */

  async function uploadArtworkImage(
    imageFile: File,
  ): Promise<string> {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      throw new Error(
        "Authentication required before uploading an artwork image.",
      );
    }

    const storageResponse = await fetch(
      `${API_URL}/api/admin/storage/usage`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!storageResponse.ok) {
      throw new Error(
        "Unable to verify available storage. Upload cancelled.",
      );
    }

    const storageData = await storageResponse.json();

    if (!storageData.success) {
      throw new Error(
        storageData.message ||
          "Unable to verify available storage. Upload cancelled.",
      );
    }

    if (
      storageData.usedBytes >= storageData.limitBytes ||
      storageData.usedBytes + imageFile.size >
        storageData.limitBytes
    ) {
      throw new Error(
        "Storage limit reached. This artwork image cannot be uploaded.",
      );
    }

    const extension =
      imageFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `artwork-${crypto.randomUUID()}.${extension}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("artworks")
      .upload(
        filePath,
        imageFile,
        {
          cacheControl: "2592000",
          upsert: false,
          contentType: imageFile.type,
        },
      );

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from("artworks")
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error(
        "Artwork image was uploaded, but its public URL could not be created.",
      );
    }

    return data.publicUrl;
  }

  /*
   * ADD ARTWORK
   */

  async function handleAdd(
    data: ArtworkFormData,
    imageFile: File | null,
  ) {
    try {
      setError(null);

      const imageUrl = imageFile
        ? await uploadArtworkImage(imageFile)
        : data.image || null;

      await createArtwork({
        title: data.title.trim(),

        price: data.price
          ? Number(data.price)
          : null,

        shipping_fee: data.shipping_fee
          ? Number(data.shipping_fee)
          : 0,

        category:
          data.category || null,

        medium:
          data.medium || null,

        dimensions:
          data.dimensions || null,

        year: data.year
          ? Number(data.year)
          : null,

        description:
          data.description || null,

        image:
          imageUrl,

        featured:
          Boolean(data.featured),

        status:
          data.status || "available",
      });

      setShowAddModal(false);

      await loadArtworks();
    } catch (err) {
      console.error(
        "Failed to add artwork:",
        err,
      );

      throw err;
    }
  }

  /*
   * EDIT ARTWORK
   */

  async function handleEdit(
    data: ArtworkFormData,
    imageFile: File | null,
  ) {
    if (!editingArtwork) {
      return;
    }

    try {
      setError(null);

      const imageUrl = imageFile
        ? await uploadArtworkImage(imageFile)
        : editingArtwork.image;

      await updateArtwork(
        editingArtwork.id,
        {
          title:
            data.title.trim(),

          price: data.price
            ? Number(data.price)
            : null,

          shipping_fee: data.shipping_fee
            ? Number(data.shipping_fee)
            : 0,

          category:
            data.category || null,

          medium:
            data.medium || null,

          dimensions:
            data.dimensions || null,

          year: data.year
            ? Number(data.year)
            : null,

          description:
            data.description || null,

          image:
            imageUrl || null,

          featured:
            Boolean(data.featured),

          status:
            data.status ||
            "available",
        },
      );

      if (
        imageFile &&
        editingArtwork.image &&
        imageUrl !== editingArtwork.image
      ) {
        try {
          const marker =
            "/storage/v1/object/public/artworks/";
          const markerIndex =
            editingArtwork.image.indexOf(marker);

          if (markerIndex !== -1) {
            const oldFilePath =
              decodeURIComponent(
                editingArtwork.image.slice(
                  markerIndex + marker.length,
                ),
              );

            if (oldFilePath) {
              const { error: storageError } =
                await supabase.storage
                  .from("artworks")
                  .remove([oldFilePath]);

              if (storageError) {
                console.error(
                  "Artwork image replacement cleanup failed:",
                  storageError,
                );
              }
            }
          }
        } catch (storageError) {
          console.error(
            "Artwork image replacement cleanup failed:",
            storageError,
          );
        }
      }

      setEditingArtwork(null);

      await loadArtworks();
    } catch (err) {
      console.error(
        "Failed to update artwork:",
        err,
      );

      throw err;
    }
  }

  /*
   * OPEN DELETE MODAL
   *
   * IMPORTANT:
   * This does NOT delete anything.
   */

  function openDeleteModal(
    artwork: Artwork,
  ) {
    setDeleteError(null);
    setSelectedArtwork(null);
    setDeletingArtwork(artwork);
  }

  /*
   * CLOSE DELETE MODAL
   */

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setDeletingArtwork(null);
    setDeleteError(null);
  }

  /*
   * ACTUAL DELETE
   *
   * This is only called after the user
   * confirms inside DeleteArtworkModal.
   */

  async function confirmDelete() {
    if (!deletingArtwork) {
      return;
    }

    const artworkId =
      deletingArtwork.id;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      /*
       * DELETE FROM SUPABASE
       */

      await deleteArtwork(
        artworkId,
      );

      /*
       * REMOVE FROM LOCAL STATE
       */

      setArtworks((current) =>
        current.filter(
          (artwork) =>
            artwork.id !==
            artworkId,
        ),
      );

      /*
       * CLOSE MODAL
       */

      setDeletingArtwork(null);
      setSelectedArtwork(null);

      /*
       * FIX PAGINATION
       */

      setCurrentPage((page) => {
        const remaining =
          filteredArtworks.length -
          1;

        const newTotalPages =
          Math.max(
            1,
            Math.ceil(
              remaining /
                itemsPerPage,
            ),
          );

        return Math.min(
          page,
          newTotalPages,
        );
      });
    } catch (err) {
      console.error(
        "DELETE ARTWORK ERROR:",
        err,
      );

      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete artwork.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  /*
   * FEATURED TOGGLE
   */

  async function handleToggleFeatured(
    artwork: Artwork,
  ) {
    const newFeatured =
      !Boolean(
        artwork.featured,
      );

    try {
      setFeaturedError(null);

      const updatedArtwork =
        await updateArtwork(
          artwork.id,
          {
            featured:
              newFeatured,
          },
        );

      setArtworks((current) =>
        current.map((item) =>
          item.id === artwork.id
            ? {
                ...item,
                featured:
                  updatedArtwork.featured,
              }
            : item,
        ),
      );

      setSelectedArtwork(null);
    } catch (err) {
      console.error(
        "Failed to update featured:",
        err,
      );

      setFeaturedError(
        newFeatured
          ? "Failed to feature artwork."
          : "Failed to unfeature artwork.",
      );
    }
  }

  /*
   * ACTION MENU
   */

  function handleEditClick(
    artwork: Artwork,
  ) {
    setSelectedArtwork(null);
    setEditingArtwork(
      artwork,
    );
  }

  function handleDeleteClick(
    artwork: Artwork,
  ) {
    openDeleteModal(
      artwork,
    );
  }

  return (
    <>
      <div className="space-y-5">

        {/* ACTION BAR */}

        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          {/* CATEGORY FILTER */}

          <div className="relative w-full sm:w-80">

            <select
              value={
                selectedCategory
              }
              onChange={(event) => {
                setSelectedCategory(
                  event.target.value,
                );

                setCurrentPage(1);
              }}
              className="
                w-full
                appearance-none
                rounded-xl
                border
                border-neutral-300
                bg-[#161618]
                px-4
                py-3.5
                pr-10
                text-sm
                text-white
                outline-none
                transition
                focus:border-white/30
              "
            >
              <option value="all">
                All Categories
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

            <ChevronDown
              size={16}
              className="
                pointer-events-none
                absolute
                right-4
                top-1/2
                -translate-y-1/2
                text-[var(--admin-text-faint)]
              "
            />

          </div>

          {/* ADD */}

          <button
            type="button"
            onClick={() =>
              setShowAddModal(
                true,
              )
            }
            className="
              fixed
              bottom-6
              right-6
              z-40
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              bg-white
              text-black
              shadow-2xl
              transition
              hover:scale-105
              sm:static
              sm:h-auto
              sm:w-auto
              sm:rounded-xl
              sm:px-5
              sm:py-3
              sm:shadow-none
            "
          >
            <Plus size={18} />

            <span className="hidden sm:inline">
              Add Artwork
            </span>
          </button>

        </div>

        {/* TABLE */}

        <div
  className=" min-w-0 w-full max-w-full
    flex
    h-[calc(100vh-410px)]
    flex-col
    overflow-hidden
    rounded-2xl
    border
    border-[var(--admin-border)]
    bg-[var(--admin-surface)]
  "
>

          <div
  className=" min-w-0 w-full max-w-full
    min-h-0
    flex-1
    overflow-x-auto overflow-y-auto
  "
>

            <table
              className="
                w-full
                min-w-[800px]
                border-separate
                border-spacing-0
              "
            >

              <thead>
                <tr className="text-left">

                  <th className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                    Image
                  </th>

                  <th className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                    Title
                  </th>

                  <th className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                    Price
                  </th>

                  <th className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                    Category
                  </th>

                  <th className="sticky top-0 z-20 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[var(--admin-text-muted)]">
                    Featured
                  </th>

                  <th
                    className="sticky right-0 top-0 z-40 w-16 border-b border-l border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4"
                  />

                </tr>
              </thead>

              <tbody>

                {/* LOADING SKELETON */}

                {loading &&
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr
                      key={`artwork-skeleton-${index}`}
                      className="bg-[var(--admin-surface)]"
                    >
                      {/* IMAGE */}

                      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                        <div className="h-14 w-14 animate-pulse rounded-xl bg-[var(--admin-surface-soft)]" />
                      </td>

                      {/* TITLE */}

                      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                        <div className="h-4 w-36 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                      </td>

                      {/* PRICE */}

                      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                        <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                      </td>

                      {/* CATEGORY */}

                      <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">
                        <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--admin-surface-soft)]" />
                      </td>

                      {/* FEATURED */}

                      <td className="border-b border-[var(--admin-border-soft)] px-3 py-4">
                        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--admin-surface-soft)]" />
                      </td>

                      {/* ACTION */}

                      <td className="sticky right-0 z-10 border-b border-l border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4">
                        <div className="h-9 w-9 animate-pulse rounded-lg bg-[var(--admin-surface-soft)]" />
                      </td>
                    </tr>
                  ))}

                {/* ERROR */}

                {!loading &&
                  error && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-0"
                      >
                        <ErrorState
                          type="network"
                          title="Connection Lost"
                          message={
                            error ||
                            "We couldn't load the artwork collection. Please check your internet connection and try again."
                          }
                          actionLabel="Refresh"
                          onAction={() => {
                            void loadArtworks();
                          }}
                        />
                      </td>
                    </tr>
                  )}

                {/* EMPTY */}

                {!loading &&
                  !error &&
                  filteredArtworks.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-20 text-center"
                      >
                        <p className="text-sm text-[var(--admin-text-faint)]">
                          No artworks found.
                        </p>

                        {selectedCategory !==
                          "all" && (
                          <p className="mt-1 text-xs text-white/20">
                            No artworks are
                            available in this
                            category.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}

                {/* ROWS */}

                {!loading &&
                  !error &&
                  currentArtworks.map(
                    (artwork) => (
                      <tr
                        key={
                          artwork.id
                        }
                        className={[
                          "group transition-colors duration-300",
                          isLight
                            ? "bg-white hover:bg-neutral-50"
                            : "bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-soft)]",
                        ].join(" ")}
                      >

                        {/* IMAGE */}

                        <td className="border-b border-[var(--admin-border-soft)] px-5 py-4">

                          <div
                            className="
                              h-14
                              w-14
                              overflow-hidden
                              rounded-xl
                              bg-[var(--admin-surface-soft)]
                            "
                          >
                            {artwork.image ? (
                              <img
                                src={
                                  artwork.image
                                }
                                alt={
                                  artwork.title ??
                                  "Artwork"
                                }
                                className="
                                  h-full
                                  w-full
                                  object-cover
                                "
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-white/20">
                                —
                              </div>
                            )}
                          </div>

                        </td>

                        {/* TITLE */}

                        <td
                        className={[
                          "border-b border-[var(--admin-border-soft)] px-5 py-4 text-sm font-medium",
                          "text-[var(--admin-text)]",
                        ].join(" ")}
                      >
                          {artwork.title ||
                            "Untitled"}
                        </td>

                        {/* PRICE */}

                        <td className="border-b border-[var(--admin-border-soft)] px-5 py-4 text-sm text-[var(--admin-text-muted)]">
                          {artwork.price !==
                          null
                            ? `₦${artwork.price.toLocaleString()}`
                            : "—"}
                        </td>

                        {/* CATEGORY */}

                        <td className="border-b border-[var(--admin-border-soft)] px-5 py-4 text-sm text-[var(--admin-text-muted)]">
                          {artwork.category ||
                            "—"}
                        </td>

                        {/* FEATURED */}

                        <td className="border-b border-[var(--admin-border-soft)] px-3 py-4">

                          {artwork.featured ? (
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-full
                                bg-white/10
                                px-3
                                py-1
                                text-xs
                              "
                            >
                              <Star
                                size={12}
                                fill="currentColor"
                              />

                              Featured
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--admin-text-faint)]">
                              Not featured
                            </span>
                          )}

                        </td>

                        {/* ACTION */}

                        <td
                          className="
                            sticky
                            right-0
                            z-30
                            w-16
                            border-b
                            border-l
                            border-[var(--admin-border)]
                            bg-[var(--admin-surface)]
                            px-5
                            py-4
                          "
                        >

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedArtwork(
                                artwork,
                              )
                            }
                            className="
                              flex
                              h-9
                              w-9
                              items-center
                              justify-center
                              rounded-lg
                              text-[var(--admin-text-faint)]
                              transition
                              hover:bg-[var(--admin-surface-soft)]
                              hover:text-[var(--admin-text)]
                            "
                            aria-label={`Actions for ${
                              artwork.title ||
                              "Untitled"
                            }`}
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>

                        </td>

                      </tr>
                    ),
                  )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          {!loading &&
            !error &&
            filteredArtworks.length >
              0 && (
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-t
                  border-neutral-300
                  px-5
                  py-4
                "
              >

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          page - 1,
                          1,
                        ),
                    )
                  }
                  className="
                    text-xs
                    text-[var(--admin-text-faint)]
                    hover:text-[var(--admin-text)]
                    disabled:opacity-20
                  "
                >
                  Prev
                </button>

                <div className="flex items-center gap-1">

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1,
                  ).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page,
                          )
                        }
                        className={`
                          flex
                          h-8
                          min-w-8
                          items-center
                          justify-center
                          rounded-lg
                          px-2
                          text-xs
                          transition
                          ${
                            currentPage ===
                            page
                              ? "bg-white text-black"
                              : "text-[var(--admin-text-faint)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"
                          }
                        `}
                      >
                        {page}
                      </button>
                    ),
                  )}

                </div>

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          page + 1,
                          totalPages,
                        ),
                    )
                  }
                  className="
                    text-xs
                    text-[var(--admin-text-faint)]
                    hover:text-[var(--admin-text)]
                    disabled:opacity-20
                  "
                >
                  Next
                </button>

              </div>
            )}

        </div>

      </div>

      {/* ACTION MENU BOTTOM SHEET */}

      {selectedArtwork && (
        <>
          <style>{`
            @keyframes artworkMenuOpen {
              0% {
                opacity: 0;
                transform: translateY(100%);
              }
              70% {
                opacity: 1;
                transform: translateY(-8px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes artworkMenuBackdrop {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes artworkMenuContentDrop {
              0% {
                opacity: 0;
                transform: translateY(24px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .artwork-menu-backdrop {
              animation: artworkMenuBackdrop 350ms ease-out both;
            }

            .artwork-menu-open {
              animation:
                artworkMenuOpen
                500ms
                cubic-bezier(0.16, 1, 0.3, 1)
                both;
            }

            .artwork-menu-content {
              animation:
                artworkMenuContentDrop
                450ms
                cubic-bezier(0.16, 1, 0.3, 1)
                both;
            }
          `}</style>

          {createPortal(
            <div
              className="
                tboyarts-admin-portal
                fixed
                inset-0
                z-[250]
              "
              onClick={() =>
                setSelectedArtwork(null)
              }
          >

            {/* BACKDROP */}

            <div
              className="
                absolute
                inset-0
                bg-black/60
                backdrop-blur-sm
                artwork-menu-backdrop
              "
            />

            {/* BOTTOM SHEET */}

            <div
              className="
                absolute
                bottom-0
                left-0
                right-0
                mx-auto
                w-full
                max-w-lg
                overflow-hidden
                rounded-t-3xl
                border
                border-[var(--admin-border)]
                bg-[var(--admin-surface-soft)]
                shadow-2xl
                artwork-menu-open
              "
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HANDLE */}

              <div className="flex justify-center pt-3 artwork-menu-content">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              {/* HEADER */}

              <div
                className="flex items-center justify-between px-6 pb-4 pt-5 artwork-menu-content"
                style={{ animationDelay: "70ms" }}
              >
                <div>
                  <h3 className="mt-1 text-base font-medium text-[var(--admin-text)]">
                    {selectedArtwork.title ||
                      "Untitled"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedArtwork(null)
                  }
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-transparent
                    text-[var(--admin-text-faint)]
                    transition-colors
                    duration-200
                    hover:bg-[var(--admin-surface-soft)]
                    hover:text-[var(--admin-text)]
                  "
                >
                  <X size={18} />
                </button>
              </div>

              {/* ACTIONS */}

              <div className="border-t border-[var(--admin-border)] px-3 pb-6 pt-3">

                {/* EDIT */}

                <button
                  type="button"
                  onClick={() =>
                    handleEditClick(
                      selectedArtwork,
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    bg-transparent
                    px-4
                    py-4
                    text-left
                    text-sm
                    text-[var(--admin-text-muted)]
                    transition-all
                    duration-200
                    hover:bg-[var(--admin-surface-soft)]
                    hover:text-[var(--admin-text)]
                    artwork-menu-content
                  "
                  style={{ animationDelay: "130ms" }}
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-transparent
                      transition-colors
                      duration-200
                      group-hover:bg-[var(--admin-surface-soft)]
                    "
                  >
                    <Pencil size={17} />
                  </span>

                  <span>
                    <span className="block text-sm text-[var(--admin-text)]">
                      Edit Artwork
                    </span>

                    <span className="mt-0.5 block text-xs text-[var(--admin-text-faint)]">
                      Change artwork details
                    </span>
                  </span>
                </button>

                {/* COPY LINK */}

                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedArtwork) return;

                    const url =
                      `${window.location.origin}/shop?artwork=${encodeURIComponent(
                        selectedArtwork.id,
                      )}`;

                    try {
                      await navigator.clipboard.writeText(url);
                    } catch (error) {
                      console.error(
                        "Failed to copy artwork link:",
                        error,
                      );
                    }
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    bg-transparent
                    px-4
                    py-4
                    text-left
                    text-sm
                    text-[var(--admin-text-muted)]
                    transition-all
                    duration-200
                    hover:bg-[var(--admin-surface-soft)]
                    hover:text-[var(--admin-text)]
                    artwork-menu-content
                  "
                  style={{ animationDelay: "160ms" }}
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-transparent
                    "
                  >
                    <Link size={17} />
                  </span>

                  <span>
                    <span className="block text-sm text-[var(--admin-text)]">
                      Copy Link
                    </span>

                    <span className="mt-0.5 block text-xs text-[var(--admin-text-faint)]">
                      Copy a direct link to this artwork
                    </span>
                  </span>
                </button>

                {/* FEATURED */}

                <button
                  type="button"
                  onClick={() =>
                    handleToggleFeatured(
                      selectedArtwork,
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    bg-transparent
                    px-4
                    py-4
                    text-left
                    text-sm
                    text-[var(--admin-text-muted)]
                    transition-all
                    duration-200
                    hover:bg-[var(--admin-surface-soft)]
                    hover:text-[var(--admin-text)]
                    artwork-menu-content
                  "
                  style={{ animationDelay: "190ms" }}
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-transparent
                    "
                  >
                    <Star
                      size={17}
                      fill={
                        selectedArtwork.featured
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </span>

                  <span>
                    <span className="block text-sm text-[var(--admin-text)]">
                      {selectedArtwork.featured
                        ? "Remove Featured"
                        : "Make Featured"}
                    </span>

                    <span className="mt-0.5 block text-xs text-[var(--admin-text-faint)]">
                      {selectedArtwork.featured
                        ? "Remove from featured sections"
                        : "Display in featured sections"}
                    </span>
                  </span>
                </button>

                {featuredError && (
                  <div className="mx-4 mb-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
                    <div className="flex items-start justify-between gap-3">
                      <span>
                        {featuredError}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setFeaturedError(null)
                        }
                        className="shrink-0 font-medium text-red-300 transition hover:text-red-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* DELETE */}

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteClick(
                      selectedArtwork,
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    bg-transparent
                    px-4
                    py-4
                    text-left
                    transition-all
                    duration-200
                    hover:bg-red-500/10
                    artwork-menu-content
                  "
                  style={{ animationDelay: "250ms" }}
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-transparent
                      text-red-400
                    "
                  >
                    <Trash2 size={17} />
                  </span>

                  <span>
                    <span className="block text-sm text-red-400">
                      Delete Artwork
                    </span>

                    <span className="mt-0.5 block text-xs text-red-400/40">
                      Permanently remove this artwork
                    </span>
                  </span>
                </button>

              </div>
            </div>
          </div>,
            document.body,
          )}
        </>
      )}

      {/* ADD MODAL */}

      {showAddModal && (
        <AddArtworkModal
          onClose={() =>
            setShowAddModal(
              false,
            )
          }
          onSubmit={handleAdd}
        />
      )}

      {/* EDIT MODAL */}

      {editingArtwork && (
        <EditArtworkModal
          artwork={{
            title:
              editingArtwork.title ??
              "",

            price:
              editingArtwork.price?.toString() ??
              "",

            shipping_fee:
              editingArtwork.shipping_fee?.toString() ??
              "0",

            category:
              editingArtwork.category ??
              "",

            medium:
              editingArtwork.medium ??
              "",

            dimensions:
              editingArtwork.dimensions ??
              "",

            year:
              editingArtwork.year?.toString() ??
              "",

            description:
              editingArtwork.description ??
              "",

            image:
              editingArtwork.image ??
              "",

            featured:
              Boolean(
                editingArtwork.featured,
              ),

            status:
              editingArtwork.status ??
              "available",
          }}
          onClose={() =>
            setEditingArtwork(
              null,
            )
          }
          onSubmit={handleEdit}
        />
      )}

      {/* DELETE MODAL */}

      <DeleteArtworkModal
        artwork={
          deletingArtwork
        }
        isDeleting={
          isDeleting
        }
        error={
          deleteError
        }
        onClose={
          closeDeleteModal
        }
        onConfirm={
          confirmDelete
        }
      />
    </>
  );
}
