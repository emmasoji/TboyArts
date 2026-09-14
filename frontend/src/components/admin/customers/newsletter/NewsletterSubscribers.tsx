import { useEffect, useState } from "react";
import {
  Mail,
  Trash2,
} from "lucide-react";

import {
  getNewsletterSubscribers,
} from "../../../../services/newsletterService";

import type {
  NewsletterSubscriber,
} from "../../../../services/newsletterService";

interface NewsletterSubscribersProps {
  refreshKey?: number;
  onDelete: (
    subscriber: NewsletterSubscriber,
  ) => void;
}

export default function NewsletterSubscribers({
  refreshKey = 0,
  onDelete,
}: NewsletterSubscribersProps) {
  const [subscribers, setSubscribers] =
    useState<NewsletterSubscriber[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, [refreshKey]);

  async function loadSubscribers() {
    try {
      setLoading(true);
      setError(null);

      const data =
        await getNewsletterSubscribers();

      setSubscribers(data);
    } catch (err) {
      console.error(
        "Failed to load subscribers:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load newsletter subscribers.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
          Newsletter
        </p>

        <h3 className="mt-1 text-xl font-medium">
          Subscribers
        </h3>

        <p className="mt-1 text-sm text-white/40">
          Manage customers subscribed to your newsletter.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full min-w-[650px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left">
                <th className="sticky top-0 z-20 border-b border-white/10 bg-[#111113] px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                  Email
                </th>

                <th className="sticky top-0 z-20 border-b border-white/10 bg-[#111113] px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                  Subscribed
                </th>

                <th className="sticky top-0 z-20 border-b border-white/10 bg-[#111113] px-5 py-4 text-xs font-medium uppercase tracking-wider text-white/35">
                  Status
                </th>

                <th className="sticky right-0 top-0 z-30 w-16 border-b border-l border-white/10 bg-[#111113] px-4 py-4" />
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="border-b border-white/5 px-5 py-4">
                      <div className="h-4 w-52 max-w-full animate-pulse rounded-md bg-white/10" />
                    </td>

                    <td className="border-b border-white/5 px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded-md bg-white/10" />
                    </td>

                    <td className="border-b border-white/5 px-5 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
                    </td>

                    <td className="sticky right-0 border-b border-l border-white/10 bg-[#111113] px-4 py-4">
                      <div className="ml-auto h-9 w-9 animate-pulse rounded-lg bg-white/10" />
                    </td>
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-20 text-center"
                  >
                    <p className="text-sm text-red-400/70">
                      {error}
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                subscribers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-20 text-center"
                    >
                      <Mail
                        size={24}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-3 text-sm text-white/40">
                        No newsletter subscribers yet.
                      </p>
                    </td>
                  </tr>
                )}

              {!loading &&
                !error &&
                subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="group transition hover:bg-white/[0.02]"
                  >
                    <td className="border-b border-white/5 px-5 py-4">
                      <span className="text-sm text-white/75">
                        {subscriber.email}
                      </span>
                    </td>

                    <td className="border-b border-white/5 px-5 py-4">
                      <span className="text-sm text-white/45">
                        {new Date(
                          subscriber.subscribed_at,
                        ).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="border-b border-white/5 px-5 py-4">
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          capitalize
                          ${
                            subscriber.active
                              ? "bg-green-400/10 text-green-400"
                              : "bg-white/5 text-white/35"
                          }
                        `}
                      >
                        {subscriber.active
                          ? "Active"
                          : "Unsubscribed"}
                      </span>
                    </td>

                    <td className="sticky right-0 border-b border-l border-white/10 bg-[#111113] px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onDelete(subscriber)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-red-400/10 hover:text-red-400"
                        aria-label={`Delete ${subscriber.email}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
