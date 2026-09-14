import Skeleton from "./Skeleton";

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

    </div>
  );
}
