import { supabase } from "../lib/supabase";
import type { Artwork } from "./artworkService";

export interface AdvertisementProduct {
  id: string;
  advertisement_id: string;
  artwork_id: string;
  title: string;
  text: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  artwork: Artwork;
}

export interface Advertisement {
  id: string;
  title: string;
  text: string;
  button_text: string;
  banner_image: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  products: AdvertisementProduct[];
}

export interface AdvertisementInput {
  title: string;
  text: string;
  button_text: string;
  banner_image: string | null;
  active: boolean;
  display_order: number;
}

export interface AdvertisementProductInput {
  artwork_id: string;
  title: string;
  text: string;
  display_order: number;
}

type AdvertisementRow = Omit<
  Advertisement,
  "products"
>;

type AdvertisementProductRow = Omit<
  AdvertisementProduct,
  "artwork"
>;

function sortProducts(
  products: AdvertisementProduct[],
): AdvertisementProduct[] {
  return [...products].sort(
    (a, b) =>
      a.display_order - b.display_order,
  );
}

/**
 * Load all advertisements.
 *
 * Admin uses this so inactive advertisements
 * remain visible and editable.
 */
export async function getAdvertisements(): Promise<
  Advertisement[]
> {
  const { data, error } = await supabase
    .from("advertisements")
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

  const advertisements =
    (data ?? []) as AdvertisementRow[];

  if (advertisements.length === 0) {
    return [];
  }

  const advertisementIds =
    advertisements.map(
      (advertisement) =>
        advertisement.id,
    );

  const { data: productData, error: productError } =
    await supabase
      .from("advertisement_products")
      .select("*")
      .in(
        "advertisement_id",
        advertisementIds,
      )
      .order("display_order", {
        ascending: true,
      });

  if (productError) {
    throw productError;
  }

  const productRows =
    (productData ?? []) as AdvertisementProductRow[];

  const artworkIds = Array.from(
    new Set(
      productRows.map(
        (product) => product.artwork_id,
      ),
    ),
  );

  let artworks: Artwork[] = [];

  if (artworkIds.length > 0) {
    const { data: artworkData, error: artworkError } =
      await supabase
        .from("artworks")
        .select("*")
        .in("id", artworkIds);

    if (artworkError) {
      throw artworkError;
    }

    artworks = (artworkData ?? []) as Artwork[];
  }

  const artworkMap = new Map(
    artworks.map((artwork) => [
      artwork.id,
      artwork,
    ]),
  );

  return advertisements.map(
    (advertisement) => {
      const products =
        productRows
          .filter(
            (product) =>
              product.advertisement_id ===
              advertisement.id,
          )
          .map((product) => {
            const artwork =
              artworkMap.get(
                product.artwork_id,
              );

            if (!artwork) {
              return null;
            }

            return {
              ...product,
              artwork,
            };
          })
          .filter(
            (
              product,
            ): product is AdvertisementProduct =>
              product !== null,
          );

      return {
        ...advertisement,
        products: sortProducts(products),
      };
    },
  );
}

/**
 * Load the first active advertisement.
 *
 * The lowest display_order wins.
 * The customer-facing page can later request
 * a specific advertisement by ID.
 */
export async function getActiveAdvertisement(): Promise<
  Advertisement | null
> {
  const { data, error } = await supabase
    .from("advertisements")
    .select("*")
    .eq("active", true)
    .order("display_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const advertisement =
    data as AdvertisementRow;

  const { data: productData, error: productError } =
    await supabase
      .from("advertisement_products")
      .select("*")
      .eq(
        "advertisement_id",
        advertisement.id,
      )
      .order("display_order", {
        ascending: true,
      });

  if (productError) {
    throw productError;
  }

  const productRows =
    (productData ?? []) as AdvertisementProductRow[];

  if (productRows.length === 0) {
    return {
      ...advertisement,
      products: [],
    };
  }

  const artworkIds = Array.from(
    new Set(
      productRows.map(
        (product) => product.artwork_id,
      ),
    ),
  );

  const { data: artworkData, error: artworkError } =
    await supabase
      .from("artworks")
      .select("*")
      .in("id", artworkIds);

  if (artworkError) {
    throw artworkError;
  }

  const artworkMap = new Map(
    ((artworkData ?? []) as Artwork[]).map(
      (artwork) => [
        artwork.id,
        artwork,
      ],
    ),
  );

  const products = productRows
    .map((product) => {
      const artwork = artworkMap.get(
        product.artwork_id,
      );

      if (!artwork) {
        return null;
      }

      return {
        ...product,
        artwork,
      };
    })
    .filter(
      (
        product,
      ): product is AdvertisementProduct =>
        product !== null,
    );

  return {
    ...advertisement,
    products: sortProducts(products),
  };
}

/**
 * Load one advertisement by ID.
 *
 * Used by the dedicated advertisement page
 * and the admin editor.
 */
export async function getAdvertisementById(
  id: string,
): Promise<Advertisement | null> {
  if (!id) {
    return null;
  }

  const advertisements =
    await getAdvertisements();

  return (
    advertisements.find(
      (advertisement) =>
        advertisement.id === id,
    ) ?? null
  );
}

/**
 * Create an advertisement.
 */
export async function createAdvertisement(
  input: AdvertisementInput,
): Promise<Advertisement> {
  const { data, error } = await supabase
    .from("advertisements")
    .insert({
      title: input.title,
      text: input.text,
      button_text: input.button_text,
      banner_image: input.banner_image,
      active: input.active,
      display_order:
        input.display_order,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const advertisement =
    data as AdvertisementRow;

  return {
    ...advertisement,
    products: [],
  };
}

/**
 * Update an advertisement.
 */
export async function updateAdvertisement(
  id: string,
  input: AdvertisementInput,
): Promise<Advertisement> {
  if (!id) {
    throw new Error(
      "Advertisement ID is missing.",
    );
  }

  const { data, error } = await supabase
    .from("advertisements")
    .update({
      title: input.title,
      text: input.text,
      button_text: input.button_text,
      banner_image: input.banner_image,
      active: input.active,
      display_order:
        input.display_order,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const advertisement =
    data as AdvertisementRow;

  const existing =
    await getAdvertisementById(id);

  return {
    ...advertisement,
    products:
      existing?.products ?? [],
  };
}

/**
 * Remove an advertisement banner only when no advertisement
 * still references it. Never remove artwork image files.
 */
async function removeAdvertisementBannerIfUnused(
  imageUrl: string,
): Promise<boolean> {
  const marker = "/storage/v1/object/public/artworks/";
  const markerIndex = imageUrl.indexOf(marker);

  // Do not touch external URLs or unrecognized paths.
  if (markerIndex === -1) {
    return true;
  }

  let filePath: string;

  try {
    filePath = decodeURIComponent(
      imageUrl.slice(markerIndex + marker.length),
    );
  } catch {
    return false;
  }

  // Allow only a uniquely named advertisement banner file.
  if (
    filePath.includes("/") ||
    !/^advertisement-[a-z0-9-]+\.[a-z0-9]+$/i.test(filePath)
  ) {
    return true;
  }

  // Protect a banner still referenced by another advertisement.
  const { data: references, error: referenceError } = await supabase
    .from("advertisements")
    .select("id")
    .eq("banner_image", imageUrl)
    .limit(1);

  if (referenceError) {
    console.error(
      "Could not verify advertisement banner references:",
      referenceError,
    );
    return false;
  }

  if (references && references.length > 0) {
    return true;
  }

  const { error: storageError } = await supabase.storage
    .from("artworks")
    .remove([filePath]);

  if (storageError) {
    console.error(
      "Advertisement was deleted, but banner cleanup failed:",
      storageError,
    );
    return false;
  }

  return true;
}

/**
 * Delete an advertisement and clean up its banner when safe.
 *
 * Linked advertisement_products rows rely on the database
 * ON DELETE CASCADE constraint.
 */
export async function deleteAdvertisement(
  id: string,
): Promise<boolean> {
  if (!id) {
    throw new Error("Advertisement ID is missing.");
  }

  const { data: advertisement, error: lookupError } = await supabase
    .from("advertisements")
    .select("banner_image")
    .eq("id", id)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  const { error: deleteError } = await supabase
    .from("advertisements")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw deleteError;
  }

  if (!advertisement?.banner_image) {
    return true;
  }

  // The database deletion succeeded; false indicates cleanup trouble.
  try {
    return await removeAdvertisementBannerIfUnused(
      advertisement.banner_image,
    );
  } catch (error) {
    console.error("Advertisement banner cleanup failed:", error);
    return false;
  }
}

/**
 * Add one artwork to an advertisement.
 */
export async function addAdvertisementProduct(
  advertisementId: string,
  input: AdvertisementProductInput,
): Promise<AdvertisementProduct> {
  if (!advertisementId) {
    throw new Error(
      "Advertisement ID is missing.",
    );
  }

  if (!input.artwork_id) {
    throw new Error(
      "Artwork ID is missing.",
    );
  }

  const { data, error } = await supabase
    .from("advertisement_products")
    .insert({
      advertisement_id:
        advertisementId,
      artwork_id:
        input.artwork_id,
      title:
        input.title,
      text:
        input.text,
      display_order:
        input.display_order,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const product =
    data as AdvertisementProductRow;

  const { data: artworkData, error: artworkError } =
    await supabase
      .from("artworks")
      .select("*")
      .eq("id", input.artwork_id)
      .single();

  if (artworkError) {
    throw artworkError;
  }

  return {
    ...product,
    artwork:
      artworkData as Artwork,
  };
}

/**
 * Update an advertisement product.
 */
export async function updateAdvertisementProduct(
  id: string,
  input: Omit<
    AdvertisementProductInput,
    "artwork_id"
  >,
): Promise<AdvertisementProduct> {
  if (!id) {
    throw new Error(
      "Advertisement product ID is missing.",
    );
  }

  const { data, error } = await supabase
    .from("advertisement_products")
    .update({
      title: input.title,
      text: input.text,
      display_order:
        input.display_order,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const product =
    data as AdvertisementProductRow;

  const { data: artworkData, error: artworkError } =
    await supabase
      .from("artworks")
      .select("*")
      .eq("id", product.artwork_id)
      .single();

  if (artworkError) {
    throw artworkError;
  }

  return {
    ...product,
    artwork:
      artworkData as Artwork,
  };
}

/**
 * Remove an artwork from an advertisement.
 */
export async function deleteAdvertisementProduct(
  id: string,
): Promise<void> {
  if (!id) {
    throw new Error(
      "Advertisement product ID is missing.",
    );
  }

  const { error } = await supabase
    .from("advertisement_products")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

/**
 * Change the actual artwork customer visibility.
 *
 * This deliberately updates artworks.customer_visible.
 * There is no duplicate visibility state on the
 * advertisement product.
 */
export async function updateArtworkCustomerVisibility(
  artworkId: string,
  customerVisible: boolean,
): Promise<Artwork> {
  if (!artworkId) {
    throw new Error(
      "Artwork ID is missing.",
    );
  }

  const { data, error } = await supabase
    .from("artworks")
    .update({
      customer_visible:
        customerVisible,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", artworkId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Artwork;
}
