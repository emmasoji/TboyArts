import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import ErrorState from "../../errors/ErrorState";

export interface ArtworkFormData {
  title: string;
  price: string;
  category: string;
  medium: string;
  dimensions: string;
  year: string;
  description: string;
  image: string;
  featured: boolean;
  status: string;
}

interface ArtworkFormModalProps {
  mode: "add" | "edit";
  initialData?: Partial<ArtworkFormData>;
  onClose: () => void;
  onSubmit: (
    data: ArtworkFormData,
  ) => void | Promise<void>;
}

interface TaxonomyItem {
  id: string;
  name: string;
}

const emptyForm: ArtworkFormData = {
  title: "",
  price: "",
  category: "",
  medium: "",
  dimensions: "",
  year: "",
  description: "",
  image: "",
  featured: false,
  status: "available",
};

export default function ArtworkFormModal({
  mode,
  initialData,
  onClose,
  onSubmit,
}: ArtworkFormModalProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [form, setForm] =
    useState<ArtworkFormData>({
      ...emptyForm,
      ...initialData,
    });

  const [categories, setCategories] =
    useState<TaxonomyItem[]>([]);

  const [mediums, setMediums] =
    useState<TaxonomyItem[]>([]);

  const [loadingTaxonomy, setLoadingTaxonomy] =
    useState(true);

  const [taxonomyError, setTaxonomyError] =
    useState<string | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialData,
    });

    setSubmitError(null);
  }, [initialData]);

  useEffect(() => {
    loadTaxonomy();
  }, []);

  async function loadTaxonomy() {
    try {
      setLoadingTaxonomy(true);
      setTaxonomyError(null);
      setTaxonomyError(null);

      const [
        categoriesResult,
        mediumsResult,
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name")
          .order("display_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("mediums")
          .select("id, name")
          .order("created_at", {
            ascending: true,
          }),
      ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (mediumsResult.error) {
        throw mediumsResult.error;
      }

      setCategories(
        categoriesResult.data ?? [],
      );

      setMediums(
        mediumsResult.data ?? [],
      );
    } catch (error) {
      console.error(
        "Failed to load categories and mediums:",
        error,
      );

      setTaxonomyError(
        error instanceof Error
          ? error.message
          : "We couldn't load categories and mediums. Please try again.",
      );
    } finally {
      setLoadingTaxonomy(false);
    }
  }

  const updateField = <
    K extends keyof ArtworkFormData
  >(
    field: K,
    value: ArtworkFormData[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const preview =
      URL.createObjectURL(file);

    updateField("image", preview);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (error) {
      console.error(
        "Failed to save artwork:",
        error,
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't save this artwork. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(


      <div className="admin-artwork-editor fixed inset-0 z-[9999] overflow-hidden">
      <style>{`
        @keyframes artworkModalOpen {
          0% {
            opacity: 0;
            transform: translateY(-90px) scale(0.94);
          }

          45% {
            opacity: 1;
            transform: translateY(12px) scale(1.01);
          }

          70% {
            transform: translateY(-4px) scale(1);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes artworkContentDrop {
          0% {
            opacity: 0;
            transform: translateY(-45px);
          }

          60% {
            opacity: 1;
            transform: translateY(7px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes artworkBackdropFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .artwork-modal-open {
          animation: artworkModalOpen 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .artwork-content-drop {
          animation: artworkContentDrop 650ms cubic-bezier(0.16, 1, 0.3, 1) 180ms both;
        }

        .artwork-backdrop-fade {
          animation: artworkBackdropFade 450ms ease-out both;
        }
      `}</style>

      {/* BACKDROP */}

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm artwork-backdrop-fade"
        onClick={onClose}
      />

      {/* SLIDE PANEL */}

      <div
        className="
          absolute inset-y-0 right-0
          flex w-full flex-col
          bg-[#0d0d0f]
          shadow-2xl
          animate-[modalOpen_450ms_cubic-bezier(0.16,1,0.3,1)]
        "
      >

        {/* HEADER */}

        <header className="artwork-content-drop 
          flex shrink-0
          items-center
          justify-between
          border-b
          border-white/10
          px-5
          py-5
          sm:px-8
        ">

          <div>

            <p className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.25em]
              text-white/30
            ">
              Artwork Management
            </p>

            <h2 className="
              mt-1
              font-serif
              text-2xl
              sm:text-3xl
            ">
              {mode === "add"
                ? "Add Artwork"
                : "Edit Artwork"}
            </h2>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-11 w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              text-white/50
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close"
          >
            <X size={20} />
          </button>

        </header>

        {/* CONTENT */}

        <form
          
          onSubmit={handleSubmit}
          className="artwork-content-drop flex min-h-0 flex-1 flex-col"
        >

          <div className="flex-1 overflow-y-auto">

            <div className="
              mx-auto
              w-full
              max-w-5xl
              px-5
              py-7
              sm:px-8
              sm:py-10
            ">

              <div className="
                grid
                gap-8
                lg:grid-cols-[minmax(320px,0.85fr)_minmax(400px,1.15fr)]
              ">

                {/* IMAGE SECTION */}

                <div>

                  <label className="
                    mb-3
                    block
                    text-xs
                    font-medium
                    uppercase
                    tracking-wider
                    text-white/40
                  ">
                    Artwork Image
                  </label>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    className={`
                      group
                      relative
                      flex
                      min-h-[360px]
                      w-full
                      cursor-pointer
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-3xl
                      border
                      border-dashed
                      transition-all
                      duration-300
                      sm:min-h-[460px]

                      ${
                        isDragging
                          ? "border-white bg-white/[0.08] scale-[1.01]"
                          : "border-white/15 bg-white/[0.025] hover:border-white/30 hover:bg-white/[0.04]"
                      }
                    `}
                  >

                    {form.image ? (
                      <>
                        <img
                          src={form.image}
                          alt="Artwork preview"
                          className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            bg-black/20
                          "
                        />

                        <div className="
                          absolute
                          inset-0
                          flex
                          items-end
                          justify-center
                          bg-gradient-to-t
                          from-black/60
                          via-transparent
                          to-transparent
                          opacity-0
                          transition
                          group-hover:opacity-100
                        ">
                          <span className="
                            mb-6
                            rounded-full
                            bg-black/70
                            px-4
                            py-2
                            text-xs
                            text-white
                          ">
                            Click or drop another image
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="
                        flex
                        flex-col
                        items-center
                        px-6
                        text-center
                      ">

                        <div className="
                          mb-5
                          flex
                          h-16
                          w-16
                          items-center
                          justify-center
                          rounded-2xl
                          bg-white/[0.06]
                          text-white/30
                        ">
                          {isDragging ? (
                            <Upload size={28} />
                          ) : (
                            <ImageIcon size={28} />
                          )}
                        </div>

                        <h3 className="
                          text-sm
                          font-medium
                          text-white/70
                        ">
                          {isDragging
                            ? "Drop artwork here"
                            : "Upload artwork"}
                        </h3>

                        <p className="
                          mt-2
                          max-w-xs
                          text-xs
                          leading-5
                          text-white/30
                        ">
                          Drag and drop your artwork here,
                          or click anywhere to browse your
                          device.
                        </p>

                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                  </div>

                  <p className="
                    mt-3
                    text-xs
                    text-white/25
                  ">
                    Recommended: high-resolution JPG,
                    PNG, or WebP.
                  </p>

                </div>

                {/* FORM FIELDS */}

                <div className="space-y-6">

                  {/* TITLE */}

                  <div>

                    <label
                      htmlFor="artwork-title"
                      className="
                        mb-2
                        block
                        text-xs
                        font-medium
                        text-white/50
                      "
                    >
                      Title
                    </label>

                    <input
                      id="artwork-title"
                      value={form.title}
                      onChange={(event) =>
                        updateField(
                          "title",
                          event.target.value,
                        )
                      }
                      placeholder="Artwork title"
                      required
                      className="
                        w-full
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        px-4
                        py-3.5
                        text-sm
                        text-white
                        outline-none
                        transition
                        placeholder:text-white/20
                        focus:border-white/30
                        focus:bg-white/[0.05]
                      "
                    />

                  </div>

                  {/* PRICE + CATEGORY */}

                  <div className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  ">

                    {/* PRICE */}

                    <div>

                      <label
                        htmlFor="artwork-price"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Price
                      </label>

                      <input
                        id="artwork-price"
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(event) =>
                          updateField(
                            "price",
                            event.target.value,
                          )
                        }
                        placeholder="0"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-white/[0.03]
                          px-4
                          py-3.5
                          text-sm
                          outline-none
                          placeholder:text-white/20
                          focus:border-white/30
                        "
                      />

                    </div>

                    {taxonomyError && (
                      <div className="mb-6">
                        <ErrorState
                          type="network"
                          title="Unable to Load Categories"
                          message={taxonomyError}
                          actionLabel="Try Again"
                          onAction={() => {
                            void loadTaxonomy();
                          }}
                        />
                      </div>
                    )}

                    {/* CATEGORY DROPDOWN */}

                    <div>

                      <label
                        htmlFor="artwork-category"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Category
                      </label>

                      <select
                        id="artwork-category"
                        value={form.category}
                        onChange={(event) =>
                          updateField(
                            "category",
                            event.target.value,
                          )
                        }
                        disabled={loadingTaxonomy}
                        className=" admin-artwork-select
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-[#161618]
                          px-4
                          py-3.5
                          text-sm
                          text-white
                          outline-none
                          focus:border-white/30
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        <option value="">
                          {loadingTaxonomy
                            ? "Loading categories..."
                            : "Select a category"}
                        </option>

                        {categories.map(
                          (category) => (
                            <option
                              key={category.id}
                              value={category.name}
                            >
                              {category.name}
                            </option>
                          ),
                        )}

                      </select>

                    </div>

                  </div>

                  {/* MEDIUM + DIMENSIONS */}

                  <div className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  ">

                    {/* MEDIUM DROPDOWN */}

                    <div>

                      <label
                        htmlFor="artwork-medium"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Medium
                      </label>

                      <select
                        id="artwork-medium"
                        value={form.medium}
                        onChange={(event) =>
                          updateField(
                            "medium",
                            event.target.value,
                          )
                        }
                        disabled={loadingTaxonomy}
                        className=" admin-artwork-select
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-[#161618]
                          px-4
                          py-3.5
                          text-sm
                          text-white
                          outline-none
                          focus:border-white/30
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        <option value="">
                          {loadingTaxonomy
                            ? "Loading mediums..."
                            : "Select a medium"}
                        </option>

                        {mediums.map(
                          (medium) => (
                            <option
                              key={medium.id}
                              value={medium.name}
                            >
                              {medium.name}
                            </option>
                          ),
                        )}

                      </select>

                    </div>

                    {/* DIMENSIONS */}

                    <div>

                      <label
                        htmlFor="artwork-dimensions"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Dimensions
                      </label>

                      
                      <input
                        id="artwork-dimensions"
                        value={form.dimensions}
                        onChange={(event) =>
                          updateField(
                            "dimensions",
                            event.target.value,
                          )
                        }
                        placeholder="24 × 36 inches"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-white/[0.03]
                          px-4
                          py-3.5
                          text-sm
                          outline-none
                          placeholder:text-white/20
                          focus:border-white/30
                        "
                      />

                    </div>

                  </div>

                  {/* YEAR + STATUS */}

                  <div className="
                    grid
                    gap-4
                    sm:grid-cols-2
                  ">

                    <div>

                      <label
                        htmlFor="artwork-year"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Year
                      </label>

                      <input
                        id="artwork-year"
                        type="number"
                        value={form.year}
                        onChange={(event) =>
                          updateField(
                            "year",
                            event.target.value,
                          )
                        }
                        placeholder="2026"
                        className="
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-white/[0.03]
                          px-4
                          py-3.5
                          text-sm
                          outline-none
                          placeholder:text-white/20
                          focus:border-white/30
                        "
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="artwork-status"
                        className="
                          mb-2
                          block
                          text-xs
                          font-medium
                          text-white/50
                        "
                      >
                        Status
                      </label>

                      <select
                        id="artwork-status"
                        value={form.status}
                        onChange={(event) =>
                          updateField(
                            "status",
                            event.target.value,
                          )
                        }
                        className=" admin-artwork-select
                          w-full
                          rounded-xl
                          border
                          border-white/10
                          bg-[#161618]
                          px-4
                          py-3.5
                          text-sm
                          outline-none
                          focus:border-white/30
                        "
                      >

                        <option value="available">
                          Available
                        </option>

                        <option value="sold">
                          Sold
                        </option>

                        <option value="view-only">
                          View Only
                        </option>

                      </select>

                    </div>

                  </div>

                  {/* DESCRIPTION */}

                  <div>

                    <label
                      htmlFor="artwork-description"
                      className="
                        mb-2
                        block
                        text-xs
                        font-medium
                        text-white/50
                      "
                    >
                      Description
                    </label>

                    <textarea
                      id="artwork-description"
                      value={form.description}
                      onChange={(event) =>
                        updateField(
                          "description",
                          event.target.value,
                        )
                      }
                      rows={6}
                      placeholder="Describe the artwork..."
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.03]
                        px-4
                        py-3.5
                        text-sm
                        outline-none
                        placeholder:text-white/20
                        focus:border-white/30
                      "
                    />

                  </div>

                  {/* FEATURED */}

                  <label className="
                    flex
                    cursor-pointer
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.02]
                    p-4
                    transition
                    hover:bg-white/[0.04]
                  ">

                    <div>

                      <p className="text-sm font-medium">
                        Featured artwork
                      </p>

                      <p className="
                        mt-1
                        text-xs
                        text-white/30
                      ">
                        Display this artwork in featured
                        sections.
                      </p>

                    </div>

                    <input
                      type="checkbox"
                      checked={Boolean(form.featured)}
                      onChange={(event) =>
                        updateField(
                          "featured",
                          event.target.checked,
                        )
                      }
                      className="h-5 w-5 accent-white"
                    />

                  </label>

                </div>

              </div>

            </div>

          </div>

          {/* SUBMIT ERROR */}

          {submitError && (
            <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-8">
              <ErrorState
                type="server"
                title={
                  mode === "add"
                    ? "Unable to Add Artwork"
                    : "Unable to Update Artwork"
                }
                message={submitError}
                actionLabel="Dismiss"
                onAction={() => setSubmitError(null)}
              />
            </div>
          )}

          {/* FOOTER */}

          <footer className="
            flex
            shrink-0
            flex-col-reverse
            gap-3
            border-t
            border-white/10
            bg-[#0d0d0f]
            px-5
            py-4
            sm:flex-row
            sm:justify-end
            sm:px-8
          ">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="
                rounded-xl
                border
                border-white/10
                px-6
                py-3
                text-sm
                text-white/50
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                admin-artwork-save
                rounded-xl
                bg-white
                px-6
                py-3
                text-sm
                font-medium
                text-black
                transition
                hover:bg-white/90
              "
            >
              {isSubmitting
                ? "Saving..."
                : mode === "add"
                  ? "Add Artwork"
                  : "Save Changes"}
            </button>

          </footer>

        </form>

      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }

          to {
            transform: translateX(0);
          }
        }
      `}</style>

    </div>,
      document.body,
  );
}
