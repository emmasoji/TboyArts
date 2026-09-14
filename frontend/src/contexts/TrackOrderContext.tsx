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

  const openTrackOrder = useCallback((orderNumber?: string) => {
    setTrackOrderNumber(orderNumber?.trim() || "");
    setIsTrackOrderOpen(true);
  }, []);

  const closeTrackOrder = useCallback(() => {
    setIsTrackOrderOpen(false);
    setTrackOrderNumber("");
  }, []);

  const value = useMemo(
    () => ({
      isTrackOrderOpen,
      openTrackOrder,
      trackOrderNumber,
      closeTrackOrder,
    }),
    [
      isTrackOrderOpen,
      openTrackOrder,
      closeTrackOrder,
      trackOrderNumber,
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
