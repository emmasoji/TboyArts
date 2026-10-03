import { useEffect } from "react";
import {
  Outlet,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import TrackOrderModal from "../tracking/TrackOrderModal";
import { CartProvider } from "../../contexts/CartContext";
import CartModal from "../cart/CartModal";
import { useTrackOrder } from "../../contexts/TrackOrderContext";
import { CookieConsentProvider } from "../../contexts/CookieConsentContext";
import CookieConsent from "../cookies/CookieConsent";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openTrackOrder } = useTrackOrder();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (searchParams.get("trackOrder") !== "1") {
      return;
    }

    const orderNumber = searchParams.get("order") || "";

    openTrackOrder(orderNumber);

    searchParams.delete("trackOrder");
    searchParams.delete("order");
    setSearchParams(searchParams, { replace: true });
  }, [
    searchParams,
    setSearchParams,
    openTrackOrder,
  ]);

  return (
    <CookieConsentProvider>
      <CartProvider>
        <Outlet />
        <TrackOrderModal />
        <CartModal />
        <CookieConsent />
      </CartProvider>
    </CookieConsentProvider>
  );
}
