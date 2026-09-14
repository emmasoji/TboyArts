import {
  Mail,
  MoreVertical,
} from "lucide-react";

import type {
  NewsletterSubscriber,
} from "../../../services/newsletterService";

import ErrorState from "../../errors/ErrorState";

interface SubscriberTableProps {
  subscribers: NewsletterSubscriber[];
  loading: boolean;
  error: string | null;
  onSubscriberClick: (
    subscriber: NewsletterSubscriber,
  ) => void;
}

export default function SubscriberTable({
  subscribers,
  loading,
  error,
  onSubscriberClick,
}: SubscriberTableProps) {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/[0.015]
      "
    >
      <div className="max-h-[520px] overflow-auto">

        <table
          className="
            w-full
            min-w-[700px]
            border-separate
            border-spacing-0
          "
        >
          <thead>
            <tr className="text-left">

              <th
                className="
                  sticky
                  top-0
                  z-20
                  w-16
                  border-b
                  border-white/10
                  bg-[#111113]
                  px-5
                  py-4
                "
              >
                <Mail
                  size={16}
                  className="text-white/30"
                />
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-white/10
                  bg-[#111113]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-white/35
                "
              >
                Email
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-white/10
                  bg-[#111113]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-white/35
                "
              >
                Subscribed
              </th>

              <th
                className="
                  sticky
                  top-0
                  z-20
                  border-b
                  border-white/10
                  bg-[#111113]
                  px-5
                  py-4
                  text-xs
                  font-medium
                  uppercase
                  tracking-wider
                  text-white/35
                "
              >
                Status
              </th>

              <th
                className="
                  sticky
                  right-0
                  top-0
                  z-30
                  w-16
                  border-b
                  border-l
                  border-white/10
                  bg-[#111113]
                  px-4
                  py-4
                "
              />

            </tr>
          </thead>

          <tbody>

            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td className="border-b border-white/5 px-5 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
                  </td>

                  <td className="border-b border-white/5 px-5 py-4">
                    <div className="h-4 w-48 max-w-full animate-pulse rounded-md bg-white/10" />
                  </td>

                  <td className="border-b border-white/5 px-5 py-4">
                    <div className="h-4 w-24 animate-pulse rounded-md bg-white/10" />
                  </td>

                  <td className="border-b border-white/5 px-5 py-4">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
                  </td>

                  <td className="sticky right-0 z-10 border-b border-l border-white/10 bg-[#111113] px-4 py-4">
                    <div className="ml-auto h-8 w-8 animate-pulse rounded-lg bg-white/10" />
                  </td>
                </tr>
              ))}

            {!loading && error && (
              <tr>
                <td
                  colSpan={5}
                  className="p-0"
                >
                  <ErrorState
                    type="network"
                    title="Unable to Load Subscribers"
                    message={
                      error ||
                      "We couldn't load the newsletter subscribers. Please check your internet connection and try again."
                    }
                    actionLabel="Refresh"
                    onAction={() => {
                      window.location.reload();
                    }}
                  />
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              subscribers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-20 text-center"
                  >
                    <p className="text-sm text-white/40">
                      No newsletter subscribers yet.
                    </p>
                  </td>
                </tr>
              )}

            {!loading &&
              !error &&
              subscribers.map(
                (subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="
                      group
                      transition
                      hover:bg-white/[0.02]
                    "
                  >

                    <td className="border-b border-white/5 px-5 py-4">
                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-white/5
                          text-white/40
                        "
                      >
                        <Mail size={16} />
                      </div>
                    </td>

                    <td className="border-b border-white/5 px-5 py-4">
                      <span className="text-sm text-white/80">
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
                          items-center
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          ${
                            subscriber.active
                              ? "bg-green-400/10 text-green-400"
                              : "bg-white/5 text-white/30"
                          }
                        `}
                      >
                        {subscriber.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td
                      className="
                        sticky
                        right-0
                        z-10
                        border-b
                        border-l
                        border-white/10
                        bg-[#111113]
                        px-4
                        py-4
                      "
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onSubscriberClick(
                            subscriber,
                          )
                        }
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-lg
                          text-white/40
                          transition
                          hover:bg-white/10
                          hover:text-white
                        "
                        aria-label={`Actions for ${subscriber.email}`}
                      >
                        <MoreVertical
                          size={18}
                        />
                      </button>
                    </td>

                  </tr>
                ),
              )}

          </tbody>
        </table>

      </div>
    </div>
  );
}
