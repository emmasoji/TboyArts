import {
  Plus,
  ChevronDown,
} from "lucide-react";

interface ArtworkFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAdd: () => void;
}

export default function ArtworkFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  onAdd,
}: ArtworkFiltersProps) {
  return (
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
      {/* CATEGORY */}

      <div className="relative w-full sm:w-80">
        <select
          value={selectedCategory}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
          className="
            w-full
            appearance-none
            rounded-xl
            border
            border-white/10
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

          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        <div
          className="
            pointer-events-none
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            text-white/30
          "
        >
          <ChevronDown size={16} />
        </div>
      </div>

      {/* ADD */}

      <button
        type="button"
        onClick={onAdd}
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
  );
}