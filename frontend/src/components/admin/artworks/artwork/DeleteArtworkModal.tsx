import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

import type { Artwork } from "../../../../services/artworkService";

interface DeleteArtworkModalProps {
  artwork: Artwork | null;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteArtworkModal({
  artwork,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteArtworkModalProps) {
  useEffect(() => {
    if (!artwork) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [artwork, isDeleting, onClose]);

  if (!artwork) return null;

  return createPortal(
    <div className="admin-artwork-delete-modal fixed inset-0 z-[9999]">

      <div
        className="
          absolute inset-0
          bg-black/70
          backdrop-blur-md
          animate-[fadeIn_0.2s_ease-out]
        "
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      <div className="
        relative
        flex
        min-h-full
        items-center
        justify-center
        p-5
      ">
        <div className="
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          border
          border-white/10
          bg-[#111113]
          shadow-2xl
          animate-[deleteModalIn_0.25s_ease-out]
        ">

          <div className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            px-6
            py-5
          ">
            <div className="flex items-center gap-3">

              <div className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-red-500/10
                text-red-400
              ">
                {isDeleting ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>

              <div>
                <h2 className="text-base font-medium">
                  {isDeleting
                    ? "Deleting Artwork"
                    : "Delete Artwork"}
                </h2>

                <p className="mt-0.5 text-xs text-white/35">
                  {isDeleting
                    ? "Please wait..."
                    : "This action cannot be undone."}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                text-white/30
                hover:bg-white/10
                hover:text-white
                disabled:opacity-20
              "
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-6 py-6">

            {isDeleting ? (
              <>
                <p className="text-sm leading-6 text-white/50">
                  Deleting{" "}
                  <span className="text-white/80">
                    {artwork.title || "Untitled"}
                  </span>
                  ...
                </p>

                <div className="
                  mt-6
                  h-1
                  overflow-hidden
                  rounded-full
                  bg-white/10
                ">
                  <div className="
                    h-full
                    w-1/2
                    rounded-full
                    bg-white
                    animate-[deleteProgress_1.2s_ease-in-out_infinite]
                  " />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-white/50">
                  Are you sure you want to permanently
                  delete{" "}
                  <span className="font-medium text-white">
                    {artwork.title || "Untitled"}
                  </span>
                  ?
                </p>

                {error && (
                  <div className="
                    mt-5
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/10
                    px-4
                    py-3
                    text-sm
                    text-red-300
                  ">
                    {error}
                  </div>
                )}
              </>
            )}

          </div>

          {!isDeleting && (
            <div className="
              flex
              gap-3
              border-t
              border-white/10
              px-6
              py-5
            ">

              <button
                type="button"
                onClick={onClose}
                className="
                  flex-1
                  rounded-xl
                  border
                  border-white/10
                  px-5
                  py-3
                  text-sm
                  text-white/50
                  hover:bg-white/5
                  hover:text-white
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="
                  flex-1
                  rounded-xl
                  bg-red-500
                  px-5
                  py-3
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-red-400
                  active:scale-[0.98]
                "
              >
                Delete
              </button>

            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes deleteModalIn {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes deleteProgress {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>

    </div>,
    document.body,
  );
}
