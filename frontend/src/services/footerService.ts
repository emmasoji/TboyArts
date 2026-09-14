import { supabase } from "../lib/supabase";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSettings {
  id: number;
  brand_text: string;
  instagram_url: string;
  facebook_url: string;
  x_url: string;
  whatsapp_url: string;
  explore_links: FooterLink[];
  customer_links: FooterLink[];
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  location: string;
  copyright_text: string;
  updated_at?: string;
}

export const defaultFooterSettings: FooterSettings = {
  id: 1,

  brand_text:
    "Original artwork created to express ideas, emotion, identity and imagination.",

  instagram_url: "",
  facebook_url: "",
  x_url: "",
  whatsapp_url: "",

  explore_links: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "About the Artist", href: "/artist" },
    { label: "Track Order", href: "#track-order" },
  ],

  customer_links: [
    { label: "New Arrivals", href: "/shop" },
    { label: "Shopping Cart", href: "/cart" },
    { label: "Track an Order", href: "#track-order" },
  ],

  contact_email: "hello@tboyarts.com",
  contact_phone: "",
  contact_address: "Lagos, Nigeria",
  location: "Lagos, Nigeria",

  copyright_text: "TboyArts. All rights reserved.",
};

export async function getFooterSettings(): Promise<FooterSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load site settings:", error);
    return defaultFooterSettings;
  }

  if (!data) {
    return defaultFooterSettings;
  }

  return {
    ...defaultFooterSettings,

    id: 1,

    contact_email: data.contact_email ?? defaultFooterSettings.contact_email,
    contact_phone: data.contact_phone ?? "",
    contact_address:
      data.contact_address ?? defaultFooterSettings.contact_address,
    location:
      data.contact_address ?? defaultFooterSettings.location,

    instagram_url: data.instagram_url ?? "",
    facebook_url: data.facebook_url ?? "",
    x_url: data.x_url ?? "",
    whatsapp_url: data.whatsapp_url ?? "",

    updated_at: data.updated_at ?? undefined,
  };
}

export async function saveFooterSettings(
  settings: FooterSettings,
): Promise<FooterSettings> {
  const payload = {
    id: 1,
    contact_email: settings.contact_email.trim(),
    contact_phone: settings.contact_phone.trim(),
    contact_address: settings.contact_address.trim(),
    instagram_url: settings.instagram_url.trim(),
    facebook_url: settings.facebook_url.trim(),
    x_url: settings.x_url.trim(),
    whatsapp_url: settings.whatsapp_url.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...settings,
    ...data,
  };
}
