import { useState } from "react";

import DeleteSubscriberModal from "./newsletter/DeleteSubscriberModal";

import {
  deleteNewsletterSubscriber,
} from "../../../services/newsletterService";

import type {
  NewsletterSubscriber,
} from "../../../services/newsletterService";
import {
  Check,
  ChevronDown,
  ListFilter,
  Mail,
  Send,
  Users,
} from "lucide-react";

import NewsletterSubscribers from "./newsletter/NewsletterSubscribers";
import WelcomeNewsletter from "./newsletter/WelcomeNewsletter";
import UpdateNewsletter from "./newsletter/UpdateNewsletter";

type CustomerSection =
  | "subscribers"
  | "welcome"
  | "updates";

const sections: {
  id: CustomerSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "subscribers",
    label: "Subscribers",
    icon: <Users size={17} />,
  },
  {
    id: "welcome",
    label: "Welcome Newsletter",
    icon: <Mail size={17} />,
  },
  {
    id: "updates",
    label: "Update Newsletter",
    icon: <Send size={17} />,
  },
];

export default function Customers() {
  const [activeSection, setActiveSection] =
    useState<CustomerSection>("subscribers");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [selectedSubscriber, setSelectedSubscriber] =
    useState<NewsletterSubscriber | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [deleting, setDeleting] =
    useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  return (
    <section className="space-y-8">

      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Management
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl">
          Customers
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage subscribers and customer newsletters.
        </p>
      </div>

      {/* SECTION FILTER */}

      <div className="relative w-full sm:w-auto">

        <button
          type="button"
          onClick={() =>
            setFilterOpen((current) => !current)
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
        >
          <span className="flex items-center gap-3">
            <ListFilter
              size={17}
              className="text-white/40"
            />

            <span className="font-medium text-white">
              {
                sections.find(
                  (section) =>
                    section.id === activeSection,
                )?.label
              }
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
          >
            {sections.map((section) => {
              const active =
                activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(section.id);
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
            })}
          </div>
        )}

      </div>

      {/* ACTIVE SECTION */}

      <div>
        {activeSection === "subscribers" && (
          <NewsletterSubscribers
            refreshKey={refreshKey}
            onDelete={(subscriber) => {
              setDeleteError(null);
              setSelectedSubscriber(subscriber);
            }}
          />
        )}

        {activeSection === "welcome" && (
          <WelcomeNewsletter />
        )}

        {activeSection === "updates" && (
          <UpdateNewsletter />
        )}

      </div>

      {selectedSubscriber && (
        <DeleteSubscriberModal
          subscriber={selectedSubscriber}
          deleting={deleting}
          error={deleteError}
          onClose={() => {
            if (!deleting) {
              setDeleteError(null);
              setSelectedSubscriber(null);
            }
          }}
          onConfirm={async () => {
            if (deleting) return;

            try {
              setDeleting(true);
              setDeleteError(null);

              await deleteNewsletterSubscriber(
                selectedSubscriber.id,
              );

              setSelectedSubscriber(null);
              setRefreshKey(
                (current) => current + 1,
              );
            } catch (error) {
              console.error(
                "Failed to delete subscriber:",
                error,
              );

              setDeleteError(
                error instanceof Error
                  ? error.message
                  : "We couldn't delete this subscriber. Please try again.",
              );
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}

    </section>
  );
}
