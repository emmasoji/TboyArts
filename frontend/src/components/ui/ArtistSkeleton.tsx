import Skeleton from "./Skeleton";

export default function ArtistSkeleton() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <section className="px-6 pb-20 pt-32 sm:px-10 sm:pb-28 sm:pt-40 lg:px-16 lg:pb-36 lg:pt-48">
        <div className="mx-auto max-w-[1500px]">

          {/* HERO TEXT */}

          <div className="max-w-[900px]">
            <div className="mb-12">
              <div className="flex items-center gap-4">
                <Skeleton
                  width="4rem"
                  height="1px"
                  radius="0"
                />

                <Skeleton
                  width="4rem"
                  height="0.55rem"
                  radius="0.2rem"
                />
              </div>

              <Skeleton
                className="mt-6"
                width="min(70%, 600px)"
                height="clamp(3rem, 6vw, 6.5rem)"
                radius="0.5rem"
              />

              <Skeleton
                className="mt-7"
                width="min(55%, 500px)"
                height="0.8rem"
                radius="0.25rem"
              />
            </div>

            <Skeleton
              className="mt-10 sm:mt-14"
              width="min(75%, 680px)"
              height="4rem"
              radius="0.5rem"
            />
          </div>

          {/* HERO IMAGE */}

          <div className="mt-14 overflow-hidden rounded-[28px] sm:mt-20 sm:rounded-[38px] lg:mt-24 lg:rounded-[44px]">
            <Skeleton
              width="100%"
              height="clamp(420px, 60vw, 760px)"
              radius="inherit"
            />
          </div>

        </div>
      </section>

      {/* NEXT SECTION PREVIEW */}

      <section className="border-t border-[var(--border)] px-6 py-20 sm:px-10 sm:py-28 lg:px-16 lg:py-36">
        <div className="mx-auto max-w-[1500px]">
          <Skeleton
            width="5rem"
            height="0.6rem"
            radius="0.2rem"
          />

          <Skeleton
            className="mt-5"
            width="min(70%, 650px)"
            height="3rem"
            radius="0.45rem"
          />

          <div className="mt-10 space-y-3 max-w-[700px]">
            <Skeleton width="100%" height="1rem" radius="0.3rem" />
            <Skeleton width="92%" height="1rem" radius="0.3rem" />
            <Skeleton width="76%" height="1rem" radius="0.3rem" />
          </div>
        </div>
      </section>
    </main>
  );
}
