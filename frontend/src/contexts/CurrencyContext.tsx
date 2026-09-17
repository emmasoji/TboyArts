import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import API_URL from "../config/api";

export type Currency = "NGN" | "USD";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (ngnAmount: number) => string;
}

const CURRENCY_STORAGE_KEY = "tboyarts-currency";
const USD_RATE_STORAGE_KEY = "tboyarts-usd-rate";

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined,
);

interface CurrencyProviderProps {
  children: ReactNode;
}

function getSavedCurrency(): Currency | null {
  const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);

  if (savedCurrency === "NGN" || savedCurrency === "USD") {
    return savedCurrency;
  }

  return null;
}

function getSavedRate(): number | null {
  const rate = Number(
    localStorage.getItem(USD_RATE_STORAGE_KEY),
  );

  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export function CurrencyProvider({
  children,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    return getSavedCurrency() ?? "NGN";
  });

  const [usdRate, setUsdRate] = useState<number | null>(() => {
    return getSavedRate();
  });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/currency/rate`,
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const rate = Number(data?.rate);

        if (Number.isFinite(rate) && rate > 0) {
          setUsdRate(rate);
          localStorage.setItem(
            USD_RATE_STORAGE_KEY,
            String(rate),
          );
        }
      } catch {
        // Keep the previously saved exchange rate.
      }
    };

    void fetchRate();
  }, []);

  const setCurrency = (nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    localStorage.setItem(
      CURRENCY_STORAGE_KEY,
      nextCurrency,
    );
  };

  const formatPrice = (ngnAmount: number) => {
    if (currency === "USD") {
      if (usdRate === null) {
        return "Price unavailable";
      }

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(ngnAmount * usdRate);
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(ngnAmount);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);

  if (!context) {
    throw new Error(
      "useCurrency must be used inside CurrencyProvider",
    );
  }

  return context;
}
