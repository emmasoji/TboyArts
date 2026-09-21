import { supabase } from "../lib/supabase";

/* =========================================================
   ARTIST PROFILE
   ========================================================= */

export interface ArtistProfile {
  id: string;
  name: string;
  tagline: string;
  hero_text: string;
  story: string;
  profile_image: string | null;
  updated_at: string;
}

export async function getArtistProfile(): Promise<ArtistProfile | null> {
  const { data, error } = await supabase
    .from("artist_profile")
    .select("*")
    .order("updated_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ArtistProfile | null;
}

export async function updateArtistProfile(
  profile: Partial<ArtistProfile>,
): Promise<ArtistProfile> {
  const existing = await getArtistProfile();

  if (existing) {
    const { data, error } = await supabase
      .from("artist_profile")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ArtistProfile;
  }

  const { data, error } = await supabase
    .from("artist_profile")
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistProfile;
}

export async function saveArtistProfile(
  profile: Partial<ArtistProfile>,
): Promise<ArtistProfile> {
  return updateArtistProfile(profile);
}
