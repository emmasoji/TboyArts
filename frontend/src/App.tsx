import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import ErrorBoundary from "./components/errors/ErrorBoundary";
import { loadCheckout } from "./loaders/checkoutLoader";
import RouteLoadingFallback from "./components/ui/RouteLoadingFallback";
import {
  scheduleLikelyRoutePrefetch,
  setupRoutePrefetching,
} from "./routePrefetch";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Artist = lazy(() => import("./pages/Artist"));
const Checkout = lazy(loadCheckout);
const FeaturedAds = lazy(() => import("./pages/FeaturedAds"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RoutePrefetcher() {
  useEffect(() => {
    const cleanup = setupRoutePrefetching();

    scheduleLikelyRoutePrefetch();

    return cleanup;
  }, []);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <RoutePrefetcher />

      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/ads" element={<FeaturedAds />} />
          </Route>

          <Route
            path="/unsubscribe/:token"
            element={<Unsubscribe />}
          />

          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
