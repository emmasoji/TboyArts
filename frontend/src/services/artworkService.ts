import { supabase } from "../lib/supabase";

export interface Artwork {
  id: string;
  title: string | null;
  price: number | null;
  shipping_fee: number | null;
  category: string | null;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  description: string | null;
  image: string | null;
  featured: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  display_order: number | null;
  slug: string | null;
}

export async function getArtworks(): Promise<Artwork[]> {
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("display_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Artwork[];
}

export async function createArtwork(
  artwork: Partial<Artwork>,
): Promise<Artwork> {
  const { data, error } = await supabase
    .from("artworks")
    .insert(artwork)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Artwork;
}

export async function updateArtwork(
  id: string,
  artwork: Partial<Artwork>,
): Promise<Artwork> {
  const { data, error } = await supabase
    .from("artworks")
    .update({
      ...artwork,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Artwork;
}

export async function deleteArtwork(
  id: string,
): Promise<void> {
  if (!id) {
    throw new Error("Artwork ID is missing.");
  }

  /*
   * PROTECT ORDER HISTORY
   *
   * An artwork that has already been included
   * in an order must not be deleted.
   */
  const { count, error: orderCheckError } =
    await supabase
      .from("order_items")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("artwork_id", id);

  if (orderCheckError) {
    console.error(
      "Supabase artwork order check error:",
      orderCheckError,
    );

    throw new Error(
      "Unable to verify whether this artwork is part of an existing order.",
    );
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This artwork cannot be deleted because it is part of an existing order. Mark it as sold or unavailable instead.",
    );
  }

  const { error } = await supabase
    .from("artworks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Supabase deleteArtwork error:",
      error,
    );

    throw new Error(
      error.message || "Failed to delete artwork.",
    );
  }
}
