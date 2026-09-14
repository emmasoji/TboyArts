import { useState } from "react";

import ArtworkTable from "./artwork/ArtworkTable";
import CategoryMediumPanel from "./taxonomy/CategoryMediumPanel";

type ArtworkView = "artworks" | "taxonomy";

export default function Artworks() {
  const [view, setView] =
    useState<ArtworkView>("artworks");

  return (
    <section className="min-w-0 space-y-7">

      {/* PAGE TITLE */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Collection
        </p>

        <h2 className="mt-2 font-serif text-3xl sm:text-4xl">
          Artworks
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage your artwork collection.
        </p>
      </div>

      {/* TABS */}
      <div className="flex w-full gap-1 rounded-xl border border-white/10 p-1 sm:w-fit">

        <button
          type="button"
          onClick={() => setView("artworks")}
          className={`
            flex flex-1 items-center justify-center gap-2
            rounded-lg px-3 py-2
            text-sm font-medium
            transition-colors
            sm:flex-none
            ${
              view === "artworks"
                ? "bg-white text-black shadow-sm"
                : "text-white/45 hover:text-white"
            }
          `}
        >
          Artworks
        </button>

        <button
          type="button"
          onClick={() => setView("taxonomy")}
          className={`
            flex flex-1 items-center justify-center gap-2
            rounded-lg px-3 py-2
            text-sm font-medium
            transition-colors
            sm:flex-none
            ${
              view === "taxonomy"
                ? "bg-white text-black shadow-sm"
                : "text-white/45 hover:text-white"
            }
          `}
        >
          Categories & Medium
        </button>

      </div>

      {/* CONTENT */}
      {view === "artworks" ? (
        <ArtworkTable />
      ) : (
        <CategoryMediumPanel />
      )}

    </section>
  );
}