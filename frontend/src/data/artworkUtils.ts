import type { Artwork } from "../types/artwork";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);
}

export function isPurchasable(artwork: Artwork): boolean {
  return artwork.status === "available";
}

export function getFeaturedArtworks(
  artworks: Artwork[],
): Artwork[] {
  return artworks.filter((artwork) => artwork.featured);
}

export function getNewArrivals(
  artworks: Artwork[],
): Artwork[] {
  return artworks.filter((artwork) => artwork.newArrival);
}
