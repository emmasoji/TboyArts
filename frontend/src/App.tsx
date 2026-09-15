import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "./components/layout/PublicLayout";
import ErrorBoundary from "./components/errors/ErrorBoundary";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Artist = lazy(() => import("./pages/Artist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <main className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex flex-col items-center justify-center">
        <div className="mb-5 h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
        <p className="text-sm opacity-70">
          Please wait a moment
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
