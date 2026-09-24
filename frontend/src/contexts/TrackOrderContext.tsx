import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface TrackOrderContextValue {
  isTrackOrderOpen: boolean;
  openTrackOrder: (orderNumber?: string) => void;
  trackOrderNumber: string;
  trackOrderEmail: string;
  setTrackOrderEmail: (email: string) => void;
  closeTrackOrder: () => void;
}

const TrackOrderContext = createContext<
  TrackOrderContextValue | undefined
>(undefined);

export function TrackOrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackOrderEmail, setTrackOrderEmail] = useState("");

  const openTrackOrder = useCallback((orderNumber?: string) => {
    setTrackOrderNumber(orderNumber?.trim() || "");
    setTrackOrderEmail("");
    setIsTrackOrderOpen(true);
  }, []);

  const closeTrackOrder = useCallback(() => {
    setIsTrackOrderOpen(false);
    setTrackOrderNumber("");
    setTrackOrderEmail("");
  }, []);

  const value = useMemo(
    () => ({
      isTrackOrderOpen,
      openTrackOrder,
      trackOrderNumber,
      trackOrderEmail,
      setTrackOrderEmail,
      closeTrackOrder,
    }),
    [
      isTrackOrderOpen,
      openTrackOrder,
      trackOrderNumber,
      trackOrderEmail,
      closeTrackOrder,
    ],
  );

  return (
    <TrackOrderContext.Provider value={value}>
      {children}
    </TrackOrderContext.Provider>
  );
}

export function useTrackOrder() {
  const context = useContext(TrackOrderContext);

  if (!context) {
    throw new Error(
      "useTrackOrder must be used inside TrackOrderProvider",
    );
  }

  return context;
}
