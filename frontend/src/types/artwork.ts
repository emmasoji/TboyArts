export type ArtworkStatus =
  | "available"
  | "sold"
  | "view-only";

export interface Artwork {
  id: string;
  title: string;
  image: string;
  price: number;
  description: string;
  dimensions: string;
  year: number;
  status: ArtworkStatus;
  featured?: boolean;
  newArrival?: boolean;
  category?: string;
  medium?: string;
  slug?: string;
}
