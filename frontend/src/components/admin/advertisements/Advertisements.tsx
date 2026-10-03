import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  ImagePlus,
  Megaphone,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  addAdvertisementProduct,
  createAdvertisement,
  deleteAdvertisement,
  deleteAdvertisementProduct,
  getAdvertisements,
  updateAdvertisement,
  updateAdvertisementProduct,
  updateArtworkCustomerVisibility,
  type Advertisement,
} from "../../../services/advertisementService";
import {
  getArtworks,
  type Artwork,
} from "../../../services/artworkService";
import { supabase } from "../../../lib/supabase";

interface ProductDraft {
  id?: string;
  artwork_id: string;
  title: string;
  text: string;
  display_order: number;
  artwork: Artwork;
}

interface AdvertisementDraft {
  title: string;
  text: string;
  button_text: string;
  banner_image: string | null;
  active: boolean;
  display_order: number;
}

const emptyDraft: AdvertisementDraft = {
  title: "",
  text: "",
  button_text: "Explore Collection",
  banner_image: null,
  active: false,
  display_order: 0,
};

export default function Advertisements() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<AdvertisementDraft>(emptyDraft);
  const [products, setProducts] = useState<ProductDraft[]>([]);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [selectorCategory, setSelectorCategory] = useState("all");

  const [expandedProducts, setExpandedProducts] = useState<
    Record<string, boolean>
  >({});

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ads, allArtworks] = await Promise.all([
        getAdvertisements(),
        getArtworks(),
      ]);

      setAdvertisements(ads);
      setArtworks(allArtworks);
    } catch (err) {
      console.error("Failed to load advertisements:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load advertisements.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const categories = useMemo<string[]>(() => {
    return Array.from(
      new Set(
        artworks
          .map((artwork) => artwork.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const search = selectorSearch.trim().toLowerCase();

    return artworks.filter((artwork) => {
      const matchesCategory =
        selectorCategory === "all" ||
        artwork.category === selectorCategory;

      const matchesSearch =
        !search ||
        (artwork.title ?? '').toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [artworks, selectorCategory, selectorSearch]);

  const openCreate = () => {
    setEditorOpen(true);
    setEditing(null);
    setDraft({
      ...emptyDraft,
      display_order: advertisements.length,
    });
    setProducts([]);
    setExpandedProducts({});
    setError(null);
  };

  const openEdit = (ad: Advertisement) => {
    setEditorOpen(true);
    setEditing(ad);

    setDraft({
      title: ad.title,
      text: ad.text,
      button_text: ad.button_text,
      banner_image: ad.banner_image,
      active: ad.active,
      display_order: ad.display_order,
    });

    setProducts(
      ad.products.map((product) => ({
        id: product.id,
        artwork_id: product.artwork_id,
        title: product.title,
        text: product.text,
        display_order: product.display_order,
        artwork: product.artwork,
      })),
    );

    setExpandedProducts({});
    setError(null);
  };

  const closeEditor = () => {
    if (saving || uploadingBanner) return;

    setEditorOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
    setProducts([]);
    setError(null);
  };

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your admin session has expired.");
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const filePath = `advertisement-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("artworks")
        .upload(filePath, file, {
          cacheControl: "2592000",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("artworks")
        .getPublicUrl(filePath);

      if (!data.publicUrl) {
        throw new Error("Unable to create the banner URL.");
      }

      setDraft((current) => ({
        ...current,
        banner_image: data.publicUrl,
      }));
    } catch (err) {
      console.error("Banner upload failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload banner image.",
      );
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      event.target.value = "";
      return;
    }

    void uploadBanner(file);
    event.target.value = "";
  };

  const addProduct = (artwork: Artwork) => {
    if (products.some((product) => product.artwork_id === artwork.id)) {
      setSelectorOpen(false);
      return;
    }

    const nextProduct: ProductDraft = {
      artwork_id: artwork.id,
      title: artwork.title ?? '',
      text: "",
      display_order: products.length,
      artwork,
    };

    setProducts((current) => [...current, nextProduct]);
    setSelectorOpen(false);

    setExpandedProducts((current) => ({
      ...current,
      [artwork.id]: true,
    }));
  };

  const removeProduct = (index: number) => {
    setProducts((current) =>
      current
        .filter((_, productIndex) => productIndex !== index)
        .map((product, productIndex) => ({
          ...product,
          display_order: productIndex,
        })),
    );
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= products.length) return;

    setProducts((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [
        next[targetIndex],
        next[index],
      ];

      return next.map((product, productIndex) => ({
        ...product,
        display_order: productIndex,
      }));
    });
  };

  const updateProductDraft = (
    index: number,
    patch: Partial<ProductDraft>,
  ) => {
    setProducts((current) =>
      current.map((product, productIndex) =>
        productIndex === index
          ? { ...product, ...patch }
          : product,
      ),
    );
  };

  const toggleVisibility = async (
    product: ProductDraft,
    visible: boolean,
  ) => {
    setError(null);

    try {
      await updateArtworkCustomerVisibility(
        product.artwork_id,
        visible,
      );

      setProducts((current) =>
        current.map((item) =>
          item.artwork_id === product.artwork_id
            ? {
                ...item,
                artwork: {
                  ...item.artwork,
                  customer_visible: visible,
                },
              }
            : item,
        ),
      );

      setArtworks((current) =>
        current.map((artwork) =>
          artwork.id === product.artwork_id
            ? { ...artwork, customer_visible: visible }
            : artwork,
        ),
      );
    } catch (err) {
      console.error("Failed to update artwork visibility:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update artwork visibility.",
      );
    }
  };

  const saveAdvertisement = async () => {
    if (saving) return;

    if (!draft.title.trim()) {
      setError("Enter an advertisement title.");
      return;
    }

    if (!draft.banner_image) {
      setError("Add a banner image before saving the advertisement.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let savedAd: Advertisement;

      if (editing) {
        savedAd = await updateAdvertisement(editing.id, {
          title: draft.title.trim(),
          text: draft.text.trim(),
          button_text:
            draft.button_text.trim() || "Explore Collection",
          banner_image: draft.banner_image,
          active: draft.active,
          display_order: draft.display_order,
        });
      } else {
        savedAd = await createAdvertisement({
          title: draft.title.trim(),
          text: draft.text.trim(),
          button_text:
            draft.button_text.trim() || "Explore Collection",
          banner_image: draft.banner_image,
          active: draft.active,
          display_order: draft.display_order,
        });
      }

      const existingProductIds = new Set(
        editing?.products.map((product) => product.id) ?? [],
      );

      for (const product of products) {
        if (product.id && existingProductIds.has(product.id)) {
          await updateAdvertisementProduct(product.id, {
            title: product.title.trim(),
            text: product.text.trim(),
            display_order: product.display_order,
          });
        } else {
          await addAdvertisementProduct(savedAd.id, {
            artwork_id: product.artwork_id,
            title: product.title.trim(),
            text: product.text.trim(),
            display_order: product.display_order,
          });
        }
      }

      const currentProductIds = new Set(
        products
          .map((product) => product.id)
          .filter(Boolean) as string[],
      );

      if (editing) {
        for (const oldProduct of editing.products) {
          if (!currentProductIds.has(oldProduct.id)) {
            await deleteAdvertisementProduct(oldProduct.id);
          }
        }
      }

      await loadData();
      closeEditor();
    } catch (err) {
      console.error("Failed to save advertisement:", err);

      if (err && typeof err === "object") {
        const supabaseError = err as {
          message?: string;
          details?: string;
          hint?: string;
          code?: string;
        };

        console.error("Save error details:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });

        setError(
          [
            supabaseError.message,
            supabaseError.details,
            supabaseError.hint,
            supabaseError.code
              ? `Code: ${supabaseError.code}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ") || "Unable to save advertisement.",
        );
      } else {
        setError("Unable to save advertisement.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ad: Advertisement) => {
    if (
      !window.confirm(
        `Delete "${ad.title}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError(null);

    try {
      await deleteAdvertisement(ad.id);
      await loadData();

      if (editing?.id === ad.id) {
        closeEditor();
      }
    } catch (err) {
      console.error("Failed to delete advertisement:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete advertisement.",
      );
    }
  };

  const toggleExpanded = (key: string) => {
    setExpandedProducts((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] admin-theme-muted">
            <Megaphone size={15} />
            Marketing
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Advertisements
          </h1>

          <p className="mt-2 max-w-2xl text-sm admin-theme-muted">
            Create featured campaigns with a banner and a curated
            collection of existing artworks.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <Plus size={17} />
          New Advertisement
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="admin-theme-surface rounded-2xl p-8 text-sm admin-theme-muted">
          Loading advertisements...
        </div>
      ) : advertisements.length === 0 ? (
        <div className="admin-theme-surface rounded-2xl p-10 text-center">
          <Megaphone
            size={30}
            className="mx-auto mb-4 admin-theme-muted"
          />
          <h2 className="text-lg font-semibold">
            No advertisements yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm admin-theme-muted">
            Create your first featured advertisement to display a
            promotional banner on the customer homepage.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            <Plus size={17} />
            Create Advertisement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {advertisements.map((ad) => (
            <div
              key={ad.id}
              className="admin-theme-surface overflow-hidden rounded-2xl"
            >
              <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="aspect-[16/9] overflow-hidden admin-theme-surface-soft lg:aspect-auto">
                  {ad.banner_image ? (
                    <img
                      src={ad.banner_image}
                      alt={ad.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-48 items-center justify-center admin-theme-muted">
                      <ImagePlus size={28} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                            ad.active
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-neutral-500/15 admin-theme-muted",
                          ].join(" ")}
                        >
                          {ad.active ? "Active" : "Inactive"}
                        </span>

                        <span className="text-xs admin-theme-faint">
                          {ad.products.length}{" "}
                          {ad.products.length === 1
                            ? "product"
                            : "products"}
                        </span>
                      </div>

                      <h2 className="truncate text-lg font-semibold">
                        {ad.title}
                      </h2>

                      {ad.text && (
                        <p className="mt-2 line-clamp-2 text-sm admin-theme-muted">
                          {ad.text}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(ad)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm transition hover:bg-white/5"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(ad)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 text-red-500 transition hover:bg-red-500/10"
                        aria-label={`Delete ${ad.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {ad.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 rounded-xl-soft px-2 py-2"
                      >
                        <img
                          src={product.artwork.image ?? ''}
                          alt={product.artwork.title ?? ''}
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                        <span className="max-w-40 truncate text-xs">
                          {product.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {editorOpen && (
        <AdvertisementEditor
          editing={editing}
          draft={draft}
          setDraft={setDraft}
          products={products}
          artworks={artworks}
          saving={saving}
          uploadingBanner={uploadingBanner}
          bannerInputRef={bannerInputRef}
          expandedProducts={expandedProducts}
          onClose={closeEditor}
          onSave={saveAdvertisement}
          onBannerChange={handleBannerChange}
          onOpenSelector={() => {
            setSelectorSearch("");
            setSelectorCategory("all");
            setSelectorOpen(true);
          }}
          onToggleExpanded={toggleExpanded}
          onMoveProduct={moveProduct}
          onRemoveProduct={removeProduct}
          onUpdateProduct={updateProductDraft}
          onToggleVisibility={toggleVisibility}
          selectorOpen={selectorOpen}
          selectorSearch={selectorSearch}
          setSelectorSearch={setSelectorSearch}
          selectorCategory={selectorCategory}
          setSelectorCategory={setSelectorCategory}
          categories={categories}
          filteredArtworks={filteredArtworks}
          onSelectArtwork={addProduct}
          onCloseSelector={() => setSelectorOpen(false)}
          error={error}
        />
      )}
    </>
  );
}

interface AdvertisementEditorProps {
  editing: Advertisement | null;
  draft: AdvertisementDraft;
  setDraft: React.Dispatch<React.SetStateAction<AdvertisementDraft>>;
  products: ProductDraft[];
  artworks: Artwork[];
  saving: boolean;
  uploadingBanner: boolean;
  bannerInputRef: React.MutableRefObject<HTMLInputElement | null>;
  expandedProducts: Record<string, boolean>;
  onClose: () => void;
  onSave: () => void;
  onBannerChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onOpenSelector: () => void;
  onToggleExpanded: (key: string) => void;
  onMoveProduct: (index: number, direction: -1 | 1) => void;
  onRemoveProduct: (index: number) => void;
  onUpdateProduct: (
    index: number,
    patch: Partial<ProductDraft>,
  ) => void;
  onToggleVisibility: (
    product: ProductDraft,
    visible: boolean,
  ) => void;
  selectorOpen: boolean;
  selectorSearch: string;
  setSelectorSearch: (value: string) => void;
  selectorCategory: string;
  setSelectorCategory: (value: string) => void;
  categories: string[];
  filteredArtworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  onCloseSelector: () => void;
  error: string | null;
}

function AdvertisementEditor({
  editing,
  draft,
  setDraft,
  products,
  saving,
  uploadingBanner,
  bannerInputRef,
  expandedProducts,
  onClose,
  onSave,
  onBannerChange,
  onOpenSelector,
  onToggleExpanded,
  onMoveProduct,
  onRemoveProduct,
  onUpdateProduct,
  onToggleVisibility,
  selectorOpen,
  selectorSearch,
  setSelectorSearch,
  selectorCategory,
  setSelectorCategory,
  categories,
  filteredArtworks,
  onSelectArtwork,
  onCloseSelector,
  error,
}: AdvertisementEditorProps) {
  return createPortal(
    <div
      className="admin-modal-portal fixed inset-0 z-[9999] m-0 h-screen w-screen bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit Advertisement" : "Create Advertisement"}
    >
      <div className="admin-theme-bg flex h-screen w-screen flex-col overflow-hidden shadow-2xl">
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.22em] admin-theme-muted">
              {editing ? "Edit campaign" : "New campaign"}
            </p>

            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {editing ? "Edit Advertisement" : "Create Advertisement"}
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingBanner}
            className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition hover:bg-white/5 disabled:opacity-50"
            aria-label="Close advertisement editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl space-y-6 p-5 sm:p-7">
            {error && <ErrorBanner message={error} />}

      <section className="p-0">
        <div className="mb-5">
          <h2 className="text-base font-semibold">
            Advertisement Details
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider admin-theme-muted">
              Banner
            </label>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={onBannerChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className={[
                "group relative block w-full overflow-hidden rounded-2xl",
                "admin-theme-border min-h-52 sm:min-h-72",
                "transition hover:border-white/20",
                uploadingBanner ? "cursor-wait" : "",
              ].join(" ")}
            >
              {draft.banner_image ? (
                <>
                  <img
                    src={draft.banner_image}
                    alt="Advertisement banner preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                    {uploadingBanner
                      ? "Uploading..."
                      : "Change banner"}
                  </span>
                </>
              ) : (
                <span className="flex min-h-52 flex-col items-center justify-center gap-3 sm:min-h-72">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full admin-theme-surface-soft">
                    <ImagePlus size={22} />
                  </span>
                  <span className="text-sm font-medium">
                    {uploadingBanner
                      ? "Uploading banner..."
                      : "Add banner image"}
                  </span>
                </span>
              )}
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Ad title"
              value={draft.title}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  title: value,
                }))
              }
              placeholder="Summer Collection"
            />

            <Field
              label="Ad button"
              value={draft.button_text}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  button_text: value,
                }))
              }
              placeholder="Explore Collection"
            />
          </div>

          <TextAreaField
            label="Ad text"
            value={draft.text}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                text: value,
              }))
            }
            placeholder="Introduce the featured collection..."
          />

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl-soft px-4 py-4">
            <div>
              <p className="text-sm font-medium">
                Show this advertisement
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={draft.active}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  active: !current.active,
                }))
              }
              className={[
                "relative h-7 w-12 rounded-full border p-1 transition",
                draft.active
                  ? "admin-theme-border admin-theme-surface"
                  : "admin-theme-border admin-theme-input",
              ].join(" ")}
            >
              <span
                className={[
                  "block h-5 w-5 rounded-full transition-transform",
                  draft.active
                    ? "translate-x-5 admin-theme-bg"
                    : "translate-x-0 admin-theme-border admin-theme-surface-soft",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Ad Products
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenSelector}
            className="inline-flex items-center justify-center gap-2 rounded-xl border admin-theme-border px-4 py-3 text-sm font-medium transition hover:bg-white/5"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="mt-5 p-8 text-center">
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {products.map((product, index) => {
              const key = product.id ?? product.artwork_id;
              const expanded = expandedProducts[key] ?? false;
              const visible =
                product.artwork.customer_visible !== false;

              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-2xl"
                >
                  <div className="flex items-center gap-3 p-3 sm:p-4">
                    <img
                      src={product.artwork.image ?? ''}
                      alt={product.artwork.title ?? ''}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {product.title || product.artwork.title}
                      </p>

                      <p className="mt-1 truncate text-xs admin-theme-muted">
                        Artwork: {product.artwork.title}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full admin-theme-surface-soft px-2 py-1 text-[10px] admin-theme-muted">
                          {visible
                            ? "View Artwork"
                            : "Coming Soon"}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onMoveProduct(index, -1)
                        }
                        disabled={index === 0}
                        className="hidden h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5 disabled:opacity-25 sm:flex"
                        aria-label="Move product up"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onMoveProduct(index, 1)
                        }
                        disabled={index === products.length - 1}
                        className="hidden h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5 disabled:opacity-25 sm:flex"
                        aria-label="Move product down"
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleExpanded(key)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5"
                        aria-label={
                          expanded
                            ? "Collapse product"
                            : "Expand product"
                        }
                      >
                        {expanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onRemoveProduct(index)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-500 transition hover:bg-red-500/10"
                        aria-label="Remove product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="space-y-5 border-t admin-theme-border-soft p-4 sm:p-5">
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field
                          label="Product title"
                          value={product.title}
                          onChange={(value) =>
                            onUpdateProduct(index, {
                              title: value,
                            })
                          }
                          placeholder={product.artwork.title ?? ''}
                        />

                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase tracking-wider admin-theme-muted">
                            Product button
                          </label>

                          <div className="flex h-11 items-center rounded-xl px-3 text-sm">
                            {visible
                              ? "View Artwork"
                              : "Coming Soon"}
                          </div>

                        </div>
                      </div>

                      <TextAreaField
                        label="Product text"
                        value={product.text}
                        onChange={(value) =>
                          onUpdateProduct(index, {
                            text: value,
                          })
                        }
                        placeholder="Ad-specific product description..."
                      />

                      <div className="rounded-xl-soft p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Visible to customers
                            </p>

                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={visible}
                            onClick={() =>
                              void onToggleVisibility(
                                product,
                                !visible,
                              )
                            }
                            className={[
                              "relative h-7 w-12 shrink-0 rounded-full border p-1 transition",
                              visible
                                ? "admin-theme-border admin-theme-surface"
                                : "admin-theme-border admin-theme-input",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "block h-5 w-5 rounded-full transition-transform",
                                visible
                                  ? "translate-x-5 admin-theme-bg"
                                  : "translate-x-0 admin-theme-border admin-theme-surface-soft",
                              ].join(" ")}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:hidden">
                        <button
                          type="button"
                          onClick={() =>
                            onMoveProduct(index, -1)
                          }
                          disabled={index === 0}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs disabled:opacity-25"
                        >
                          <ArrowUp size={14} />
                          Move up
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onMoveProduct(index, 1)
                          }
                          disabled={index === products.length - 1}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs disabled:opacity-25"
                        >
                          <ArrowDown size={14} />
                          Move down
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectorOpen && (
        <ArtworkSelectorModal
          artworks={filteredArtworks}
          categories={categories}
          search={selectorSearch}
          setSearch={setSelectorSearch}
          category={selectorCategory}
          setCategory={setSelectorCategory}
          selectedArtworkIds={products.map(
            (product) => product.artwork_id,
          )}
          onSelect={onSelectArtwork}
          onClose={onCloseSelector}
        />
      )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 bg-inherit px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploadingBanner}
            className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving || uploadingBanner}
            className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Advertisement"}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}

function ArtworkSelectorModal({
  artworks,
  categories,
  search,
  setSearch,
  category,
  setCategory,
  selectedArtworkIds,
  onSelect,
  onClose,
}: {
  artworks: Artwork[];
  categories: string[];
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  selectedArtworkIds: string[];
  onSelect: (artwork: Artwork) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div
      className="admin-modal-portal fixed inset-0 z-[10000] m-0 h-screen w-screen bg-black/75 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Choose Artwork"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="admin-theme-bg flex h-screen w-screen flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b admin-theme-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">
              Choose Artwork
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/5"
            aria-label="Close artwork selector"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-3 border-b admin-theme-border px-5 py-4 sm:grid-cols-[1fr_180px]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 admin-theme-muted"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search artwork..."
              className="admin-theme-input h-11 w-full rounded-xl border pl-10 pr-3 text-sm outline-none"
              autoFocus
            />
          </label>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="admin-theme-input h-11 rounded-xl border px-3 text-sm outline-none"
          >
            <option value="all">All categories</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {artworks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium">
                No artworks found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {artworks.map((artwork) => {
                const selected = selectedArtworkIds.includes(
                  artwork.id,
                );

                return (
                  <button
                    key={artwork.id}
                    type="button"
                    onClick={() => onSelect(artwork)}
                    disabled={selected}
                    className={[
                      "group overflow-hidden rounded-xl border text-left transition",
                      selected
                        ? "cursor-not-allowed  opacity-45"
                        : "admin-theme-border hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="relative aspect-square overflow-hidden admin-theme-surface-soft">
                      <img
                        src={artwork.image ?? ''}
                        alt={artwork.title ?? ''}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      {selected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full admin-theme-surface admin-theme-text">
                            <Check size={17} />
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-3 py-2.5">
                      <p className="truncate text-xs font-medium">
                        {artwork.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  , document.body);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider admin-theme-muted">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-theme-input h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider admin-theme-muted">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="admin-theme-input w-full resize-y rounded-xl border px-3 py-3 text-sm outline-none transition"
      />
    </label>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
      {message}
    </div>
  );
}
