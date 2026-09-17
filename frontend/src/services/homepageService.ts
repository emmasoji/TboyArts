import { supabase } from "../lib/supabase";

export interface HeroSettings {
  id: string;
  heroLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  updatedAt: string | null;
}

export async function getHeroSettings(): Promise<HeroSettings> {
  const { data, error } = await supabase
    .from("home_settings")
    .select(`
      id,
      hero_label,
      hero_title,
      hero_description,
      hero_image,
      primary_button_text,
      primary_button_url,
      secondary_button_text,
      secondary_button_url,
      updated_at
    `)
    .limit(1)
    .single();

  if (error) {
    console.error("GET HERO SETTINGS ERROR:", error);
    throw new Error(
      error.message || "Failed to load hero settings.",
    );
  }

  return {
    id: data.id,
    heroLabel: data.hero_label ?? "",
    heroTitle: data.hero_title ?? "",
    heroDescription: data.hero_description ?? "",
    heroImage: data.hero_image ?? "",
    primaryButtonText: data.primary_button_text ?? "",
    primaryButtonUrl: data.primary_button_url ?? "",
    secondaryButtonText: data.secondary_button_text ?? "",
    secondaryButtonUrl: data.secondary_button_url ?? "",
    updatedAt: data.updated_at ?? null,
  };
}

export async function updateHeroSettings(
  id: string,
  settings: Omit<HeroSettings, "id" | "updatedAt">,
): Promise<HeroSettings> {
  const { data, error } = await supabase
    .from("home_settings")
    .update({
      hero_label: settings.heroLabel,
      hero_title: settings.heroTitle,
      hero_description: settings.heroDescription,
      hero_image: settings.heroImage,
      primary_button_text: settings.primaryButtonText,
      primary_button_url: settings.primaryButtonUrl,
      secondary_button_text: settings.secondaryButtonText,
      secondary_button_url: settings.secondaryButtonUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      id,
      hero_label,
      hero_title,
      hero_description,
      hero_image,
      primary_button_text,
      primary_button_url,
      secondary_button_text,
      secondary_button_url,
      updated_at
    `)
    .single();

  if (error) {
    console.error("UPDATE HERO SETTINGS ERROR:", error);
    throw new Error(
      error.message || "Failed to update hero settings.",
    );
  }

  return {
    id: data.id,
    heroLabel: data.hero_label ?? "",
    heroTitle: data.hero_title ?? "",
    heroDescription: data.hero_description ?? "",
    heroImage: data.hero_image ?? "",
    primaryButtonText: data.primary_button_text ?? "",
    primaryButtonUrl: data.primary_button_url ?? "",
    secondaryButtonText: data.secondary_button_text ?? "",
    secondaryButtonUrl: data.secondary_button_url ?? "",
    updatedAt: data.updated_at ?? null,
  };
}

export interface AboutSettings {
  id: string;
  aboutLabel: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutImage: string;
  aboutButtonText: string;
  aboutButtonUrl: string;
  updatedAt: string | null;
}

export async function getAboutSettings(): Promise<AboutSettings> {
  const { data, error } = await supabase
    .from("home_settings")
    .select(`
      id,
      about_label,
      about_title,
      about_description,
      about_image,
      about_button_text,
      about_button_url,
      updated_at
    `)
    .limit(1)
    .single();

  if (error) {
    console.error("GET ABOUT SETTINGS ERROR:", error);

    throw new Error(
      error.message || "Failed to load about settings.",
    );
  }

  return {
    id: data.id,
    aboutLabel: data.about_label ?? "",
    aboutTitle: data.about_title ?? "",
    aboutDescription: data.about_description ?? "",
    aboutImage: data.about_image ?? "",
    aboutButtonText: data.about_button_text ?? "",
    aboutButtonUrl: data.about_button_url ?? "",
    updatedAt: data.updated_at ?? null,
  };
}

export async function updateAboutSettings(
  id: string,
  settings: Omit<AboutSettings, "id" | "updatedAt">,
): Promise<AboutSettings> {
  const { data, error } = await supabase
    .from("home_settings")
    .update({
      about_label: settings.aboutLabel,
      about_title: settings.aboutTitle,
      about_description: settings.aboutDescription,
      about_image: settings.aboutImage,
      about_button_text: settings.aboutButtonText,
      about_button_url: settings.aboutButtonUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      id,
      about_label,
      about_title,
      about_description,
      about_image,
      about_button_text,
      about_button_url,
      updated_at
    `)
    .single();

  if (error) {
    console.error("UPDATE ABOUT SETTINGS ERROR:", error);

    throw new Error(
      error.message || "Failed to update about settings.",
    );
  }

  return {
    id: data.id,
    aboutLabel: data.about_label ?? "",
    aboutTitle: data.about_title ?? "",
    aboutDescription: data.about_description ?? "",
    aboutImage: data.about_image ?? "",
    aboutButtonText: data.about_button_text ?? "",
    aboutButtonUrl: data.about_button_url ?? "",
    updatedAt: data.updated_at ?? null,
  };
}
