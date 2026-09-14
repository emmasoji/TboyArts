import { supabase } from "../lib/supabase";

/* =========================================================
   TYPES
   ========================================================= */

export interface ArtistPageSettings {
  id: string;
  story_label: string;
  story_heading: string;
  philosophy_label: string;
  philosophy_heading: string;
  process_label: string;
  process_heading: string;
  selected_works_label: string;
  selected_works_heading: string;
  commission_label: string;
  commission_heading: string;
  commission_description: string;
  commission_button_text: string;
  commission_button_url: string;
  updated_at: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  tagline: string;
  hero_text: string;
  story: string;
  profile_image: string | null;
  updated_at: string;
}

export interface ArtistPhilosophy {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ArtistProcess {
  id: string;
  title: string;
  description: string;
  image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/* =========================================================
   PAGE SETTINGS
   ========================================================= */

export async function getArtistPageSettings(): Promise<ArtistPageSettings | null> {
  const { data, error } = await supabase
    .from("artist_page_settings")
    .select("*")
    .order("updated_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ArtistPageSettings | null;
}

export async function updateArtistPageSettings(
  settings: Partial<ArtistPageSettings>,
): Promise<ArtistPageSettings> {
  const existing = await getArtistPageSettings();

  if (existing) {
    const { data, error } = await supabase
      .from("artist_page_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ArtistPageSettings;
  }

  const { data, error } = await supabase
    .from("artist_page_settings")
    .insert(settings)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistPageSettings;
}

/* =========================================================
   ARTIST PROFILE
   ========================================================= */

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

/* =========================================================
   PHILOSOPHY
   ========================================================= */

export async function getArtistPhilosophy(): Promise<
  ArtistPhilosophy[]
> {
  const { data, error } = await supabase
    .from("artist_philosophy")
    .select("*")
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as ArtistPhilosophy[];
}

export async function createArtistPhilosophy(
  philosophy: Partial<ArtistPhilosophy>,
): Promise<ArtistPhilosophy> {
  const { data, error } = await supabase
    .from("artist_philosophy")
    .insert(philosophy)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistPhilosophy;
}

export async function updateArtistPhilosophy(
  id: string,
  philosophy: Partial<ArtistPhilosophy>,
): Promise<ArtistPhilosophy> {
  const { data, error } = await supabase
    .from("artist_philosophy")
    .update({
      ...philosophy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistPhilosophy;
}

export async function deleteArtistPhilosophy(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("artist_philosophy")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}

/* =========================================================
   PROCESS
   ========================================================= */

export async function getArtistProcess(): Promise<
  ArtistProcess[]
> {
  const { data, error } = await supabase
    .from("artist_process")
    .select("*")
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as ArtistProcess[];
}

export async function createArtistProcess(
  process: Partial<ArtistProcess>,
): Promise<ArtistProcess> {
  const { data, error } = await supabase
    .from("artist_process")
    .insert(process)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistProcess;
}

export async function updateArtistProcess(
  id: string,
  process: Partial<ArtistProcess>,
): Promise<ArtistProcess> {
  const { data, error } = await supabase
    .from("artist_process")
    .update({
      ...process,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ArtistProcess;
}

export async function deleteArtistProcess(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("artist_process")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}


/* =========================================================
   COMPATIBILITY SAVE HELPERS
   ========================================================= */


/* =========================================================
   COMPATIBILITY SAVE HELPERS
   ========================================================= */

export async function saveArtistPageSettings(
  settings: Partial<ArtistPageSettings>,
): Promise<ArtistPageSettings> {
  return updateArtistPageSettings(settings);
}

export async function saveArtistProfile(
  profile: Partial<ArtistProfile>,
): Promise<ArtistProfile> {
  return updateArtistProfile(profile);
}

export async function saveArtistPhilosophy(
  philosophy: Partial<ArtistPhilosophy> & { id?: string },
): Promise<ArtistPhilosophy> {
  const { id, ...values } = philosophy;

  if (!id) {
    return createArtistPhilosophy(values);
  }

  return updateArtistPhilosophy(id, values);
}

export async function saveArtistProcess(
  process: Partial<ArtistProcess> & { id?: string },
): Promise<ArtistProcess> {
  const { id, ...values } = process;

  if (!id) {
    return createArtistProcess(values);
  }

  return updateArtistProcess(id, values);
}
