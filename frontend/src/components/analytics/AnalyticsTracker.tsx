import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCookieConsent } from "../../contexts/CookieConsentContext";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsInitialized = false;

function loadGoogleAnalytics() {
  if (analyticsInitialized) {
    return;
  }

  const measurementId =
    import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    return;
  }

  analyticsInitialized = true;

  window.dataLayer = window.dataLayer || [];

  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  window.gtag("js", new Date());

  window.gtag("config", measurementId, {
    send_page_view: false,
  });

  const existingScript = document.querySelector(
    `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`,
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");

  script.async = true;
  script.src =
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      measurementId,
    )}`;

  document.head.appendChild(script);
}

export default function AnalyticsTracker() {
  const location = useLocation();
  const { analyticsConsent } = useCookieConsent();

  useEffect(() => {
    if (analyticsConsent !== "granted") {
      return;
    }

    loadGoogleAnalytics();
  }, [analyticsConsent]);

  useEffect(() => {
    if (
      analyticsConsent !== "granted" ||
      !window.gtag
    ) {
      return;
    }

    window.gtag("event", "page_view", {
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [
    analyticsConsent,
    location.pathname,
    location.search,
  ]);

  return null;
}
