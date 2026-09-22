import {
  ArrowUpRight,
  Mail,
  MapPin,
} from "lucide-react";

import {
  faInstagram,
  faFacebookF,
  faWhatsapp,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { useTrackOrder } from "../../contexts/TrackOrderContext";
import {
  defaultFooterSettings,
  getFooterSettings,
  type FooterSettings,
} from "../../services/footerService";

export default function Footer() {
  const { openTrackOrder } = useTrackOrder();

  const [settings, setSettings] =
    useState<FooterSettings>(
      defaultFooterSettings,
    );

  const getLogoUrl = () =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Logo/logo.png`;

  const [logoUrl, setLogoUrl] = useState(getLogoUrl);

  useEffect(() => {
    let mounted = true;

    getFooterSettings().then((data) => {
      if (mounted) {
        setSettings(data);
      }
    });

    const handleLogoUpdate = () => {
      setLogoUrl(getLogoUrl());
    };

    window.addEventListener(
      "tboyarts-logo-updated",
      handleLogoUpdate,
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "tboyarts-logo-updated",
        handleLogoUpdate,
      );
    };
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleFooterLink = (
    href: string,
  ) => {
    if (href === "#track-order") {
      openTrackOrder();
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-main">

        <div className="footer-brand">
          <button
            type="button"
            className="footer-logo-button"
            onClick={scrollTop}
            aria-label="Back to top"
          >
            <img
              src={logoUrl}
              alt="TboyArts"
              className="footer-logo"
              />
          </button>

          <p className="footer-brand-text">
            {settings.brand_text}
          </p>

          <div className="footer-socials">
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="footer-social"
                aria-label="Instagram"
              >
                <FontAwesomeIcon
                  icon={faInstagram}
                />
              </a>
            )}

            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="footer-social"
                aria-label="Facebook"
              >
                <FontAwesomeIcon
                  icon={faFacebookF}
                />
              </a>
            )}

            {settings.whatsapp_url && (
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noreferrer"
                className="footer-social"
                aria-label="WhatsApp"
              >
                <FontAwesomeIcon
                  icon={faWhatsapp}
                />
              </a>
            )}

            {settings.x_url && (
              <a
                href={settings.x_url}
                target="_blank"
                rel="noreferrer"
                className="footer-social"
                aria-label="X"
              >
                <FontAwesomeIcon
                  icon={faXTwitter}
                />
              </a>
            )}
          </div>
        </div>

        <div className="footer-column">
          <p className="footer-heading">
            EXPLORE
          </p>

          {settings.explore_links.map(
            (link, index) =>
              link.href === "#track-order" ? (
                <button
                  key={`explore-${index}`}
                  type="button"
                  onClick={() =>
                    handleFooterLink(
                      link.href,
                    )
                  }
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={`explore-${index}`}
                  to={link.href}
                >
                  {link.label}
                </Link>
              ),
          )}
        </div>

        <div className="footer-column">
          <p className="footer-heading">
            CUSTOMER
          </p>

          {settings.customer_links.map(
            (link, index) =>
              link.href === "#track-order" ? (
                <button
                  key={`customer-${index}`}
                  type="button"
                  onClick={() =>
                    handleFooterLink(
                      link.href,
                    )
                  }
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={`customer-${index}`}
                  to={link.href}
                >
                  {link.label}
                </Link>
              ),
          )}
        </div>

        <div className="footer-column footer-contact">
          <p className="footer-heading">
            CONTACT
          </p>

          <a
            href={`mailto:${settings.contact_email}`}
          >
            <Mail size={15} />
            {settings.contact_email}
          </a>

          <span>
            <MapPin size={15} />
            {settings.location}
          </span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()}{" "}
          {settings.copyright_text}
        </p>

        <button
          type="button"
          className="footer-back-top"
          onClick={scrollTop}
        >
          Back to top
          <ArrowUpRight size={16} />
        </button>
      </div>
    </footer>
  );
}
