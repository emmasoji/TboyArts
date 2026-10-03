import { loadCheckout } from "./loaders/checkoutLoader";

type RouteLoader = () => Promise<unknown>;

const routeLoaders: Record<string, RouteLoader> = {
  "/": () => import("./pages/Home"),
  "/shop": () => import("./pages/Shop"),
  "/artist": () => import("./pages/Artist"),
  "/checkout": loadCheckout,
  "/ads": () => import("./pages/FeaturedAds"),
};

const prefetchedRoutes = new Set<string>();
const prefetchingRoutes = new Map<string, Promise<unknown>>();

export function preloadRoute(path: string) {
  const pathname = path.split("?")[0].split("#")[0];

  const loader = routeLoaders[pathname];

  if (!loader || prefetchedRoutes.has(pathname)) {
    return;
  }

  const existing = prefetchingRoutes.get(pathname);

  if (existing) {
    return existing;
  }

  const promise = loader()
    .then(() => {
      prefetchedRoutes.add(pathname);
    })
    .catch(() => {
      // Navigation will still use React.lazy normally.
      // A failed prefetch must never break the application.
    })
    .finally(() => {
      prefetchingRoutes.delete(pathname);
    });

  prefetchingRoutes.set(pathname, promise);

  return promise;
}

function canUseBackgroundPrefetch() {
  const connection = (
    navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
      };
    }
  ).connection;

  if (connection?.saveData) {
    return false;
  }

  if (
    connection?.effectiveType &&
    ["slow-2g", "2g"].includes(connection.effectiveType)
  ) {
    return false;
  }

  return true;
}

export function scheduleLikelyRoutePrefetch() {
  if (!canUseBackgroundPrefetch()) {
    return;
  }

  const run = () => {
    preloadRoute("/shop");
    preloadRoute("/artist");
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, {
      timeout: 4000,
    });
  } else {
    globalThis.setTimeout(run, 2500);
  }
}

export function setupRoutePrefetching() {
  const handleIntent = (event: Event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLAnchorElement>("a[href]");

    if (!link) {
      return;
    }

    if (
      link.target === "_blank" ||
      link.hasAttribute("download") ||
      link.origin !== window.location.origin
    ) {
      return;
    }

    const url = new URL(link.href);

    preloadRoute(url.pathname);
  };

  document.addEventListener("pointerover", handleIntent, {
    passive: true,
  });

  document.addEventListener("focusin", handleIntent);

  document.addEventListener("touchstart", handleIntent, {
    passive: true,
  });

  return () => {
    document.removeEventListener("pointerover", handleIntent);
    document.removeEventListener("focusin", handleIntent);
    document.removeEventListener("touchstart", handleIntent);
  };
}
