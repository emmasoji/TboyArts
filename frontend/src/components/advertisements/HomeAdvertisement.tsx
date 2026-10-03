import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getActiveAdvertisement,
  type Advertisement,
} from "../../services/advertisementService";

export default function HomeAdvertisement() {
  const navigate = useNavigate();

  const [advertisement, setAdvertisement] =
    useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAdvertisement = async () => {
      try {
        setLoading(true);

        const data = await getActiveAdvertisement();

        if (!cancelled) {
          setAdvertisement(data);
        }
      } catch (err) {
        console.error(
          "Failed to load homepage advertisement:",
          err,
        );

        if (!cancelled) {
          setAdvertisement(null);
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

  if (loading) {
    return (
      <section
        className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24"
        aria-hidden="true"
      >
        <div className="mx-auto h-[55vh] w-full max-w-[1800px] animate-pulse rounded-3xl bg-black/10 sm:h-[65vh] lg:h-[72vh]" />
      </section>
    );
  }

  if (!advertisement?.banner_image) {
    return null;
  }

  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24">
      <div className="mx-auto w-full max-w-[1800px]">
        <p className="home-eyebrow" style={{color: "#171717"}}>
          Upcoming
        </p>

        <div className="overflow-hidden rounded-3xl">
          <button
          type="button"
          onClick={() => navigate("/ads")}
          className="group relative block w-full overflow-hidden bg-white p-0 text-left outline-none"
          aria-label={
            advertisement.button_text ||
            advertisement.title ||
            "Explore advertisement"
          }
        >
          <img
            src={advertisement.banner_image}
            alt={
              advertisement.title ||
              "Featured TboyArts advertisement"
            }
            className="block h-auto max-h-[85vh] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
          />
          </button>
        </div>
      </div>
    </section>
  );
}
