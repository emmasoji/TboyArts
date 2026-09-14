import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type TaxonomyType =
  | "category"
  | "medium";

interface TaxonomyModalProps {
  type: TaxonomyType;
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function TaxonomyModal({
  type,
  initialName,
  onClose,
  onSave,
}: TaxonomyModalProps) {
  const [name, setName] =
    useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) return;

    onSave(trimmed);
  };

  const title =
    type === "category"
      ? "Category"
      : "Medium";

  return createPortal(
    <div className="admin-modal-portal fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#151517] shadow-2xl">

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Artwork
            </p>

            <h3 className="mt-1 font-serif text-xl">
              {initialName
                ? `Edit ${title}`
                : `Add ${title}`}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

        </div>

        <form onSubmit={handleSubmit}>

          <div className="p-5">

            <label
              htmlFor="taxonomy-name"
              className="mb-2 block text-xs font-medium text-white/50"
            >
              {title} name
            </label>

            <input
              id="taxonomy-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder={`Enter ${title.toLowerCase()} name`}
              autoFocus
              className="
                w-full rounded-xl
                border border-white/10
                bg-white/[0.03]
                px-4 py-3
                text-sm
                outline-none
                placeholder:text-white/20
                focus:border-white/30
              "
            />

          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl
                border border-white/10
                px-4 py-2.5
                text-sm text-white/50
                hover:bg-white/5
                hover:text-white
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                rounded-xl
                bg-white
                px-5 py-2.5
                text-sm font-medium
                text-black
                hover:bg-white/90
              "
            >
              {initialName
                ? "Save Changes"
                : `Add ${title}`}
            </button>

          </div>

        </form>

      </div>

    </div>,
    document.body,
  );
}
