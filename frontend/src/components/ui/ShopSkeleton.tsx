import Skeleton from "./Skeleton";

export default function ShopSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <article
          key={index}
          className="shop-skeleton-card"
          style={{
            animationDelay: `${index * 60}ms`,
          }}
        >
          <Skeleton
            className="shop-skeleton-image"
            width="100%"
            height="100%"
            radius="0"
          />

          <div className="shop-skeleton-info">
            <Skeleton
              width="65%"
              height="0.9rem"
              radius="0.35rem"
            />

            <Skeleton
              width="42%"
              height="0.7rem"
              radius="0.35rem"
            />

            <Skeleton
              width="30%"
              height="0.8rem"
              radius="0.35rem"
            />
          </div>
        </article>
      ))}
    </>
  );
}
