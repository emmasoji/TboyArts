import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getActiveAdvertisement,
  type Advertisement,
} from "../../services/advertisementService";

const AD_SESSION_KEY = "tboyarts_featured_ad_seen";

export default function FeaturedAdvertisementModal() {
  const navigate = useNavigate();

  const [advertisement, setAdvertisement] =
    useState<Advertisement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAdvertisement = async () => {
      try {
        setLoading(true);
        setError(false);

        const data = await getActiveAdvertisement();

        if (cancelled) return;

        setAdvertisement(data);

        const hasSeenAdvertisement =
          sessionStorage.getItem(AD_SESSION_KEY) === "true";

        if (data?.banner_image && !hasSeenAdvertisement) {
          sessionStorage.setItem(AD_SESSION_KEY, "true");
          setOpen(true);
        }
      } catch (err) {
        console.error(
          "Failed to load featured advertisement:",
          err,
        );

        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAdvertisement();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || error || !advertisement?.banner_image) {
    return null;
  }

  const openAdvertisement = () => {
    setOpen(false);
    navigate("/ads");
  };

  return (
    <AnimatePresence>
      {open && (
        
        <motion.div
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Featured advertisement"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.45,
              ease: "easeInOut",
            },
          }}
          onClick={() => setOpen(false)}
        >
          <motion.button
            type="button"
            aria-label="Close advertisement"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:right-8 sm:top-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: 0.2,
                duration: 0.55,
                ease: "easeOut",
              },
            }}
            exit={{
              opacity: 0,
              y: -10,
              transition: {
                duration: 0.25,
                ease: "easeIn",
              },
            }}
          >
            <X size={20} strokeWidth={1.8} />
          </motion.button>

          <motion.div
            className="relative flex h-[92vh] w-[96vw] flex-col items-center justify-center pt-6 sm:h-[94vh] sm:w-[96vw] sm:pt-8"
            initial={{
              opacity: 0,
              y: -90,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                opacity: {
                  duration: 0.45,
                  ease: "easeOut",
                },
                y: {
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                },
                scale: {
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                },
              },
            }}
            exit={{
              opacity: 0,
              y: 120,
              scale: 0.97,
              transition: {
                opacity: {
                  duration: 0.35,
                  ease: "easeIn",
                },
                y: {
                  duration: 0.65,
                  ease: [0.55, 0, 1, 0.45],
                },
                scale: {
                  duration: 0.65,
                  ease: "easeIn",
                },
              },
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={openAdvertisement}
              className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-transparent p-0 outline-none"
              aria-label={
                advertisement.button_text ||
                "Explore advertisement"
              }
            >
              <img
                src={advertisement.banner_image}
                alt={
                  advertisement.title ||
                  "Featured advertisement"
                }
                className="block max-h-full max-w-full object-contain"
              />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
