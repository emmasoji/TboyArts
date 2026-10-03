import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AnalyticsConsent =
  | "granted"
  | "denied"
  | null;

type CookieConsentContextValue = {
  analyticsConsent: AnalyticsConsent;
  acceptAnalytics: () => void;
  rejectAnalytics: () => void;
  openCookieSettings: () => void;
  closeCookieSettings: () => void;
  showCookieSettings: boolean;
};

const STORAGE_KEY = "tboyarts_cookie_consent";
const SESSION_KEY = "tboyarts_cookie_consent_seen";

const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

function readConsent(): AnalyticsConsent {
  const permanentChoice = localStorage.getItem(STORAGE_KEY);

  if (permanentChoice === "granted") {
    return "granted";
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    return "denied";
  }

  return null;
}

export function CookieConsentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [analyticsConsent, setAnalyticsConsent] =
    useState<AnalyticsConsent>(null);

  const [showCookieSettings, setShowCookieSettings] =
    useState(false);

  useEffect(() => {
    setAnalyticsConsent(readConsent());
  }, []);

  const setConsent = useCallback(
    (value: "granted" | "denied") => {
      if (value === "granted") {
        localStorage.setItem(STORAGE_KEY, "granted");
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.setItem(SESSION_KEY, "1");
      }

      setAnalyticsConsent(value);
      setShowCookieSettings(false);

      window.dispatchEvent(
        new CustomEvent("tboyarts-cookie-consent", {
          detail: value,
        }),
      );
    },
    [],
  );

  const acceptAnalytics = useCallback(() => {
    setConsent("granted");
  }, [setConsent]);

  const rejectAnalytics = useCallback(() => {
    setConsent("denied");
  }, [setConsent]);

  const openCookieSettings = useCallback(() => {
    setShowCookieSettings(true);
  }, []);

  const closeCookieSettings = useCallback(() => {
    setShowCookieSettings(false);
  }, []);

  const value = useMemo(
    () => ({
      analyticsConsent,
      acceptAnalytics,
      rejectAnalytics,
      openCookieSettings,
      closeCookieSettings,
      showCookieSettings,
    }),
    [
      analyticsConsent,
      acceptAnalytics,
      rejectAnalytics,
      openCookieSettings,
      closeCookieSettings,
      showCookieSettings,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider",
    );
  }

  return context;
}
