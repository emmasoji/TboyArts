import { AnimatePresence, motion } from "motion/react";
import { useCookieConsent } from "../../contexts/CookieConsentContext";

export default function CookieConsent() {
  const {
    analyticsConsent,
    acceptAnalytics,
    rejectAnalytics,
  } = useCookieConsent();

  const showBanner = analyticsConsent === null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[100] px-4 pb-4 sm:px-6"
          role="dialog"
          aria-label="Cookie preferences"
          aria-live="polite"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-950 sm:p-6">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-medium text-neutral-950 dark:text-white">
                  Help us improve TboyArts
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-white/60">
                  We use analytics to understand how visitors use the
                  site and improve the experience. Analytics cookies are
                  optional and will only be enabled with your permission.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <motion.button
                  type="button"
                  onClick={rejectAnalytics}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-black/[0.04] dark:border-white/10 dark:text-white/70 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="button"
                  onClick={acceptAnalytics}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-white/90"
                >
                  OK
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
