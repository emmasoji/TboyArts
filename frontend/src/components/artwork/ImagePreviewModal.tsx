import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import type { Artwork } from "../../types/artwork";

interface ArtworkImageViewerProps {
  artwork: Artwork | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function ArtworkImageViewer({
  artwork,
  onClose,
  onPrevious,
  onNext,
}: ArtworkImageViewerProps) {
  if (!artwork) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes viewerOpen {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(24px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes viewerDrop {
          from {
            opacity: 0;
            transform: translateY(-35px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .artwork-image-viewer {
          animation: viewerOpen 450ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .artwork-viewer-stage {
          animation: viewerDrop 550ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div className="artwork-image-viewer">
        <button
          type="button"
          className="artwork-viewer-close"
          onClick={onClose}
          aria-label="Close image viewer"
        >
          <X size={27} />
        </button>

        {onPrevious && (
          <button
            type="button"
            className="artwork-viewer-arrow artwork-viewer-prev"
            onClick={onPrevious}
            aria-label="Previous artwork"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="artwork-viewer-stage">
          <img
            src={artwork.image}
            alt={artwork.title}
            className="artwork-viewer-image"
          />

          <h2 className="artwork-viewer-title">
            {artwork.title}
          </h2>
        </div>

        {onNext && (
          <button
            type="button"
            className="artwork-viewer-arrow artwork-viewer-next"
            onClick={onNext}
            aria-label="Next artwork"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>
    </>
  );
}
