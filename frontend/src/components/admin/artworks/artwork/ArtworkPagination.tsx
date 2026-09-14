interface ArtworkPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ArtworkPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ArtworkPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className="
        flex
        items-center
        justify-between
        border-t
        border-white/10
        px-5
        py-4
      "
    >
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() =>
          onPageChange(
            Math.max(currentPage - 1, 1),
          )
        }
        className="
          text-xs
          text-white/40
          transition
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-20
        "
      >
        Prev
      </button>

      <div className="flex items-center gap-1">
        {Array.from(
          { length: totalPages },
          (_, index) => index + 1,
        ).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() =>
              onPageChange(page)
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
                currentPage === page
                  ? "bg-white text-black"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }
            `}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() =>
          onPageChange(
            Math.min(
              currentPage + 1,
              totalPages,
            ),
          )
        }
        className="
          text-xs
          text-white/40
          transition
          hover:text-white
          disabled:cursor-not-allowed
          disabled:opacity-20
        "
      >
        Next
      </button>
    </div>
  );
}