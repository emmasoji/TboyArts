import Skeleton from "./Skeleton";

function HomeAdvertisementSkeleton() {
  return (
    <section
      className="w-full bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-24"
      aria-hidden="true"
    >
      <div className="mx-auto w-full max-w-[1800px] overflow-hidden rounded-3xl">
        <Skeleton
          width="100%"
          height="clamp(420px, 65vw, 900px)"
          radius="inherit"
          className="!bg-black/[0.08]"
        />
      </div>
    </section>
  );
}

function NewArrivalsSkeleton() {
  return (
    <section className="w-full overflow-hidden py-20">
      <div className="mx-auto mb-12 flex max-w-[1600px] items-end justify-between gap-6 px-6 sm:px-10 lg:px-16">
        <div>
          <Skeleton
            width="7rem"
            height="0.65rem"
            radius="0.2rem"
          />

          <div className="mt-4 space-y-2">
            <Skeleton
              width="14rem"
              height="2.8rem"
              radius="0.4rem"
            />

            <Skeleton
              width="11rem"
              height="2.8rem"
              radius="0.4rem"
            />
          </div>
        </div>

        <Skeleton
          className="hidden sm:block"
          width="9rem"
          height="1rem"
          radius="0.3rem"
        />
      </div>

      <div className="relative flex w-full justify-center overflow-hidden">
        <div className="new-arrivals-marquee flex w-max items-center">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div
              key={groupIndex}
              className="new-arrivals-group flex items-center"
            >
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div
                  key={`${groupIndex}-${cardIndex}`}
                  className="new-arrivals-card shrink-0"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <Skeleton
                      width="100%"
                      height="100%"
                      radius="inherit"
                    />

                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <Skeleton
                        width="65%"
                        height="1.5rem"
                        radius="0.3rem"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 px-6 sm:hidden">
        <Skeleton
          width="8rem"
          height="1rem"
          radius="0.3rem"
        />
      </div>
    </section>
  );
}

function ArtistStorySkeleton() {
  return (
    <section className="w-full overflow-hidden bg-[#111113] py-20 sm:py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1500px] items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:px-16 xl:gap-28">
        <div className="relative order-1 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
          <div className="aspect-[4/5] w-full sm:aspect-[5/6] lg:aspect-[4/5]">
            <Skeleton
              width="100%"
              height="100%"
              radius="inherit"
              className="!bg-white/[0.06]"
            />
          </div>
        </div>

        <div className="order-2 max-w-2xl">
          <Skeleton
            width="8rem"
            height="0.65rem"
            radius="0.2rem"
            className="!bg-white/[0.06]"
          />

          <div className="mt-5 space-y-3">
            <Skeleton
              width="90%"
              height="3.5rem"
              radius="0.5rem"
              className="!bg-white/[0.06]"
            />

            <Skeleton
              width="65%"
              height="3.5rem"
              radius="0.5rem"
              className="!bg-white/[0.06]"
            />
          </div>

          <div className="mt-8 space-y-3">
            <Skeleton
              width="100%"
              height="0.9rem"
              radius="999px"
              className="!bg-white/[0.06]"
            />

            <Skeleton
              width="90%"
              height="0.9rem"
              radius="999px"
              className="!bg-white/[0.06]"
            />

            <Skeleton
              width="72%"
              height="0.9rem"
              radius="999px"
              className="!bg-white/[0.06]"
            />
          </div>

          <Skeleton
            className="mt-8 !bg-white/[0.06]"
            width="8rem"
            height="3rem"
            radius="999px"
          />
        </div>
      </div>
    </section>
  );
}

function HomeCTASkeleton() {
  return (
    <section className="home-cta">
      <div className="home-cta-inner">
        <Skeleton
          width="8rem"
          height="0.65rem"
          radius="0.2rem"
        />

        <div className="mt-5 space-y-3">
          <Skeleton
            width="min(80vw, 420px)"
            height="clamp(3rem, 6vw, 5rem)"
            radius="0.5rem"
          />

          <Skeleton
            width="min(65vw, 340px)"
            height="clamp(3rem, 6vw, 5rem)"
            radius="0.5rem"
          />

          <Skeleton
            width="min(55vw, 290px)"
            height="clamp(3rem, 6vw, 5rem)"
            radius="0.5rem"
          />
        </div>

        <div className="mt-8 space-y-3">
          <Skeleton
            width="min(90vw, 560px)"
            height="0.9rem"
            radius="999px"
          />

          <Skeleton
            width="min(75vw, 470px)"
            height="0.9rem"
            radius="999px"
          />

          <Skeleton
            width="min(55vw, 340px)"
            height="0.9rem"
            radius="999px"
          />
        </div>

        <div className="mt-8 flex w-full max-w-[560px]">
          <Skeleton
            width="100%"
            height="3.5rem"
            radius="999px"
          />
        </div>

        <Skeleton
          className="mt-4"
          width="14rem"
          height="0.7rem"
          radius="999px"
        />
      </div>
    </section>
  );
}

export default function HomeSkeleton() {
  return (
    <div className="home-page">
      {/* HERO */}

      <section className="home-hero">
        <Skeleton
          className="absolute inset-0"
          width="100%"
          height="100%"
          radius="0"
        />

        <div className="home-hero-content">
          <Skeleton
            width="7rem"
            height="0.6rem"
            radius="0.2rem"
          />

          <div className="mt-6 space-y-3">
            <Skeleton
              width="min(70vw, 650px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />

            <Skeleton
              width="min(55vw, 500px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />

            <Skeleton
              width="min(65vw, 580px)"
              height="clamp(3.5rem, 8vw, 7rem)"
              radius="0.5rem"
            />
          </div>

          <Skeleton
            className="mt-8"
            width="min(80vw, 620px)"
            height="3.5rem"
            radius="0.4rem"
          />

          <div className="mt-8 flex gap-4">
            <Skeleton
              width="8rem"
              height="3rem"
              radius="999px"
            />

            <Skeleton
              width="9rem"
              height="3rem"
              radius="999px"
            />
          </div>
        </div>
      </section>

      {/* FEATURED ADVERTISEMENT */}

      <HomeAdvertisementSkeleton />

      {/* FEATURED COLLECTION */}

      <section className="featured-artwork">
        <div className="featured-artwork-heading">
          <div>
            <Skeleton
              width="8rem"
              height="0.6rem"
              radius="0.2rem"
            />

            <Skeleton
              className="mt-5"
              width="min(80vw, 520px)"
              height="clamp(3rem, 6vw, 5rem)"
              radius="0.5rem"
            />

            <Skeleton
              className="mt-2"
              width="min(60vw, 380px)"
              height="clamp(3rem, 6vw, 5rem)"
              radius="0.5rem"
            />
          </div>

          <Skeleton
            width="min(80vw, 420px)"
            height="4rem"
            radius="0.5rem"
          />
        </div>

        <div className="mt-10 overflow-hidden rounded-[1.75rem]">
          <Skeleton
            width="100%"
            height="clamp(420px, 60vw, 760px)"
            radius="inherit"
          />
        </div>
      </section>

      {/* BROWSE CATEGORIES */}

      <section className="w-full overflow-hidden py-20 sm:py-24 lg:py-32">
        <div className="mx-auto mb-10 max-w-[1500px] px-6 sm:px-10 lg:px-16">
          <Skeleton
            width="10rem"
            height="0.6rem"
            radius="0.2rem"
          />

          <Skeleton
            className="mt-5"
            width="min(80vw, 650px)"
            height="3.5rem"
            radius="0.5rem"
          />

          <Skeleton
            className="mt-5"
            width="min(80vw, 480px)"
            height="2rem"
            radius="0.4rem"
          />
        </div>

        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-6 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem]"
            >
              <Skeleton
                width="100%"
                height="100%"
                radius="inherit"
              />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <Skeleton
                  width="55%"
                  height="2rem"
                  radius="0.4rem"
                />

                <Skeleton
                  className="mt-4"
                  width="45%"
                  height="0.7rem"
                  radius="0.2rem"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}

      <NewArrivalsSkeleton />

      {/* ARTIST STORY */}

      <ArtistStorySkeleton />

      {/* HOME CTA */}

      <HomeCTASkeleton />
    </div>
  );
}
