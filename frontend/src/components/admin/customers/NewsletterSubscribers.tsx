import { useEffect, useState } from "react";
import {
  Users,
  RefreshCw,
} from "lucide-react";

import {
  getNewsletterSubscribers,
} from "../../../services/newsletterService";

import type {
  NewsletterSubscriber,
} from "../../../services/newsletterService";

import ErrorState from "../../errors/ErrorState";
import SubscriberTable from "./SubscriberTable";

interface NewsletterSubscribersProps {
  onSubscriberClick: (
    subscriber: NewsletterSubscriber,
  ) => void;
}

export default function NewsletterSubscribers({
  onSubscriberClick,
}: NewsletterSubscribersProps) {
  const [
    subscribers,
    setSubscribers,
  ] = useState<NewsletterSubscriber[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

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
          : "Failed to load subscribers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscribers();
  }, []);

  const activeCount =
    subscribers.filter(
      (subscriber) =>
        subscriber.active,
    ).length;

  return (
    <section className="space-y-5">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
              <Users size={19} />
            </div>

            <div>
              <h3 className="text-xl font-medium">
                Newsletter Subscribers
              </h3>

              <p className="mt-1 text-sm text-white/35">
                Manage people subscribed to your newsletter.
              </p>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={loadSubscribers}
          disabled={loading}
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-4
            py-2.5
            text-sm
            text-white/60
            transition
            hover:bg-white/10
            hover:text-white
            disabled:opacity-40
          "
        >
          <RefreshCw
            size={15}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      <div className="flex items-center gap-2 text-xs text-white/30">
        <span>
          {subscribers.length} total
        </span>

        <span>•</span>

        <span>
          {activeCount} active
        </span>
      </div>

      {error ? (
        <ErrorState
          type="network"
          title="Unable to Load Subscribers"
          message={
            error ||
            "We couldn't load the newsletter subscribers. Please check your internet connection and try again."
          }
          actionLabel="Refresh"
          onAction={() => {
            void loadSubscribers();
          }}
        />
      ) : (
        <SubscriberTable
          subscribers={subscribers}
          loading={loading}
          error={null}
          onSubscriberClick={
            onSubscriberClick
          }
        />
      )}

    </section>
  );
}
