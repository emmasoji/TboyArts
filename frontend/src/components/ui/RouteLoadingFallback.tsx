import { useLocation } from "react-router-dom";

import HomeSkeleton from "./HomeSkeleton";
import ShopSkeleton from "./ShopSkeleton";
import ArtistSkeleton from "./ArtistSkeleton";
import Skeleton from "./Skeleton";

function PublicHeaderSkeleton() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--background)]/80 px-4 backdrop-blur-xl">
        <Skeleton width="7rem" height="1.75rem" radius="0.5rem" />

        <div className="hidden items-center gap-3 md:flex">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              width="4rem"
              height="0.75rem"
              radius="999px"
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Skeleton width="2.5rem" height="2.5rem" radius="999px" />
          <Skeleton width="2.5rem" height="2.5rem" radius="999px" />
        </div>
      </div>
    </header>
  );
}

function PublicFooterSkeleton() {
  return (
    <footer className="border-t border-[var(--border-color)] px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Skeleton width="8rem" height="1rem" radius="999px" />

        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              width="2rem"
              height="2rem"
              radius="999px"
            />
          ))}
        </div>
      </div>
    </footer>
  );
}

function PublicPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeaderSkeleton />
      {children}
      <PublicFooterSkeleton />
    </>
  );
}

function HomeRouteSkeleton() {
  return (
    <PublicPageShell>
      <main className="home-page">
        <HomeSkeleton />
      </main>
    </PublicPageShell>
  );
}

function ShopRouteSkeleton() {
  return (
    <PublicPageShell>
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="mb-10">
            <Skeleton width="7rem" height="0.75rem" radius="999px" />
            <Skeleton
              className="mt-4"
              width="15rem"
              height="3rem"
              radius="0.5rem"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <ShopSkeleton />
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}

function ArtistRouteSkeleton() {
  return (
    <PublicPageShell>
      <ArtistSkeleton />
    </PublicPageShell>
  );
}

export function FeaturedAdsRouteSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 bg-white/[0.04]">
        <div className="h-full w-full animate-pulse bg-white/[0.04]" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0 0 H 12 C 0 22, 18 72, 100 100 H 0 Z"
            fill="black"
            fillOpacity="0.88"
          />
        </svg>
      </div>

      <div className="relative z-20 flex min-h-screen w-full items-end">
        <section className="w-full px-6 pb-16 pt-24 sm:px-10 sm:pb-20 lg:w-[62%] lg:px-16 lg:pb-24 xl:w-[56%]">
          <div className="max-w-xl">
            <Skeleton
              className="bg-white/10"
              width="7rem"
              height="0.7rem"
              radius="999px"
            />

            <Skeleton
              className="mt-5 bg-white/10"
              width="85%"
              height="4rem"
              radius="0.75rem"
            />

            <Skeleton
              className="mt-3 bg-white/10"
              width="65%"
              height="4rem"
              radius="0.75rem"
            />

            <Skeleton
              className="mt-6 bg-white/10"
              width="75%"
              height="1rem"
              radius="999px"
            />

            <Skeleton
              className="mt-3 bg-white/10"
              width="55%"
              height="1rem"
              radius="999px"
            />

            <Skeleton
              className="mt-8 bg-white/10"
              width="8.5rem"
              height="3rem"
              radius="999px"
            />

            <div className="mt-10 flex gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="shrink-0 bg-white/10"
                  width="5rem"
                  height="5rem"
                  radius="0.75rem"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function CheckoutRouteSkeleton() {
  return (
    <main className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
        <div className="sticky top-0 z-40 -mx-4 mb-8 border-b border-[var(--border-color)] bg-[var(--background)] px-4 py-3 md:-mx-6 md:px-6">
          <div className="flex items-center gap-3">
            <Skeleton width="2.5rem" height="2.5rem" radius="999px" />
            <Skeleton width="12rem" height="1.4rem" radius="0.4rem" />
          </div>
        </div>

        <div className="w-full rounded-3xl bg-[var(--bg-secondary)] p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={index === 5 ? "md:col-span-2" : ""}
              >
                <Skeleton
                  width="5rem"
                  height="0.75rem"
                  radius="999px"
                />
                <Skeleton
                  className="mt-2"
                  width="100%"
                  height="3rem"
                  radius="1rem"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Skeleton width="11rem" height="3.5rem" radius="999px" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function AdminRouteSkeleton() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-white/10 bg-neutral-900 p-5 lg:block">
          <Skeleton
            className="bg-white/10"
            width="9rem"
            height="2rem"
            radius="0.5rem"
          />

          <div className="mt-10 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                className="bg-white/10"
                width="100%"
                height="2.5rem"
                radius="0.75rem"
              />
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <Skeleton
            className="bg-white/10"
            width="12rem"
            height="2rem"
            radius="0.5rem"
          />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="bg-white/10"
                width="100%"
                height="8rem"
                radius="1rem"
              />
            ))}
          </div>

          <Skeleton
            className="mt-8 bg-white/10"
            width="100%"
            height="22rem"
            radius="1rem"
          />
        </section>
      </div>
    </main>
  );
}

function UnsubscribeRouteSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4 text-[var(--text-primary)]">
      <div className="w-full max-w-md rounded-3xl bg-[var(--bg-secondary)] p-8 text-center">
        <Skeleton
          className="mx-auto"
          width="4rem"
          height="4rem"
          radius="1.25rem"
        />

        <Skeleton
          className="mx-auto mt-6"
          width="12rem"
          height="1.5rem"
          radius="0.5rem"
        />

        <Skeleton
          className="mx-auto mt-4"
          width="80%"
          height="0.9rem"
          radius="999px"
        />

        <Skeleton
          className="mx-auto mt-3"
          width="60%"
          height="0.9rem"
          radius="999px"
        />
      </div>
    </main>
  );
}

export default function RouteLoadingFallback() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return <HomeRouteSkeleton />;
  }

  if (pathname === "/shop") {
    return <ShopRouteSkeleton />;
  }

  if (pathname === "/artist") {
    return <ArtistRouteSkeleton />;
  }

  if (pathname === "/ads") {
    return <FeaturedAdsRouteSkeleton />;
  }

  if (pathname === "/checkout") {
    return <CheckoutRouteSkeleton />;
  }

  if (pathname === "/admin") {
    return <AdminRouteSkeleton />;
  }

  if (pathname.startsWith("/unsubscribe/")) {
    return <UnsubscribeRouteSkeleton />;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]" />
  );
}
