import { useState } from "react";
import {
  ListFilter,
  ChevronDown,
  Check,
  Image,
  Info,
  LayoutGrid,
} from "lucide-react";

import HeroManagement from "./hero/HeroManagement";
import BrowseCategoriesManagement from "./categories/BrowseCategoriesManagement";
import AboutManagement from "./about/AboutManagement";

type SectionId =
  | "hero"
  | "about"
  | "categories";

interface HomepageSection {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

const sections: HomepageSection[] = [
  {
    id: "hero",
    label: "Hero",
    icon: <Image size={17} />,
  },
  {
    id: "about",
    label: "About",
    icon: <Info size={17} />,
  },
  {
    id: "categories",
    label: "Browse Categories",
    icon: <LayoutGrid size={17} />,
  },
];

export default function HomepageManagement() {
  const [activeSection, setActiveSection] =
    useState<SectionId>("hero");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const activeLabel =
    sections.find(
      (section) =>
        section.id === activeSection,
    )?.label ?? "Hero";

  return (
    <section className="space-y-8">

      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Content
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl">
          Homepage
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage the content displayed across
          the homepage.
        </p>
      </div>

      {/* FILTER */}

      <div className="relative w-full sm:w-auto">

        <button
          type="button"
          onClick={() =>
            setFilterOpen(
              (current) => !current,
            )
          }
          className="
            flex
            w-full
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-3
            text-sm
            transition
            hover:bg-white/[0.05]
            sm:w-64
          "
          aria-expanded={filterOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center gap-3">

            <ListFilter
              size={17}
              className="text-white/40"
            />

            <span className="font-medium text-white">
              {activeLabel}
            </span>

          </span>

          <ChevronDown
            size={17}
            className={`text-white/40 transition ${
              filterOpen
                ? "rotate-180"
                : ""
            }`}
          />
        </button>

        {filterOpen && (
          <div
            className="
              absolute
              left-0
              top-full
              z-50
              mt-2
              w-full
              overflow-hidden
              rounded-xl
              border
              border-white/10
              bg-[#111113]
              p-1
              shadow-2xl
              sm:w-64
            "
            role="listbox"
          >
            {sections.map(
              (section) => {
                const active =
                  activeSection ===
                  section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setActiveSection(
                        section.id,
                      );
                      setFilterOpen(false);
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-3
                      text-left
                      text-sm
                      transition
                      ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <span className="text-white/40">
                      {section.icon}
                    </span>

                    <span className="flex-1">
                      {section.label}
                    </span>

                    {active && (
                      <Check
                        size={16}
                        className="text-white/70"
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}

      </div>

      {/* ACTIVE HOMEPAGE SECTION */}

      {activeSection === "hero" && (
        <HeroManagement />
      )}

      {activeSection === "about" && (
        <AboutManagement />
      )}

      {activeSection === "categories" && (
        <BrowseCategoriesManagement />
      )}

    </section>
  );
}
