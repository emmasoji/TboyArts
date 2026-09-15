import API_URL from "../../../config/api";

import {
  Check,
  Image,
  Save,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faWhatsapp,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

import { supabase } from "../../../lib/supabase";

import {
  defaultFooterSettings,
  getFooterSettings,
  saveFooterSettings,
  type FooterSettings,
} from "../../../services/footerService";

import {
  useAdminTheme,
} from "../../../contexts/AdminThemeContext";

export default function AdminSettings() {
  const { theme } = useAdminTheme();
  const light = theme === "light";

  const [footer, setFooter] =
    useState<FooterSettings>(defaultFooterSettings);

  const [loadingFooter, setLoadingFooter] = useState(true);
  const [savingFooter, setSavingFooter] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoExists, setLogoExists] = useState(true);
  const [loadingLogo, setLoadingLogo] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");
  const [logoError, setLogoError] = useState("");

  const apiBaseUrl =
    API_URL;

  const publicLogoUrl =
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Logo/logo.png`;

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoadingFooter(true);

      try {
        const data = await getFooterSettings();

        if (mounted) {
          setFooter(data);
        }
      } finally {
        if (mounted) {
          setLoadingFooter(false);
        }
      }
    }

    loadSettings();

    async function loadLogoStatus() {
      try {
        setLoadingLogo(true);
        setLogoError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Admin session not found.");
        }

        const response = await fetch(
          `${apiBaseUrl}/api/admin/storage/logo`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load logo status.",
          );
        }

        const data = await response.json();

        if (mounted) {
          setLogoExists(Boolean(data.exists));
        }
      } catch (error) {
        console.error(
          "Failed to load logo status:",
          error,
        );

        if (mounted) {
          setLogoError(
            error instanceof Error
              ? error.message
              : "Failed to load logo status.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingLogo(false);
        }
      }
    }

    loadLogoStatus();

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl]);

  const updateFooter = (changes: Partial<FooterSettings>) => {
    setFooter((current) => ({
      ...current,
      ...changes,
    }));

    setSaved(false);
    setSaveError("");
  };

  const handleSave = async () => {
    setSavingFooter(true);
    setSaved(false);
    setSaveError("");

    try {
      const updated = await saveFooterSettings(footer);

      setFooter(updated);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error: unknown) {
      console.error("Failed to save site settings:", error);

      const supabaseError = error as {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      };

      const parts = [
        supabaseError.code ? `Code: ${supabaseError.code}` : "",
        supabaseError.message ?? "",
        supabaseError.details
          ? `Details: ${supabaseError.details}`
          : "",
        supabaseError.hint
          ? `Hint: ${supabaseError.hint}`
          : "",
      ].filter(Boolean);

      setSaveError(
        parts.length > 0
          ? parts.join(" — ")
          : "Failed to save site settings.",
      );
    } finally {
      setSavingFooter(false);
    }
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingLogo(true);
    setLogoMessage("");
    setLogoError("");

    try {
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Logo must be PNG, JPEG, or WebP.",
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "Logo must be smaller than 5MB.",
        );
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session not found.");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${apiBaseUrl}/api/admin/storage/logo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        },
      );

      const data = await response.json().catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Failed to upload logo.",
        );
      }

      setLogoExists(true);
      setLogoMessage(
        "Logo uploaded successfully.",
      );

      /*
       * Force the browser to fetch the newly
       * uploaded version instead of a cached copy.
       */
      window.dispatchEvent(
        new CustomEvent("tboyarts-logo-updated"),
      );
    } catch (error) {
      console.error(
        "Failed to upload logo:",
        error,
      );

      setLogoError(
        error instanceof Error
          ? error.message
          : "Failed to upload logo.",
      );
    } finally {
      setUploadingLogo(false);

      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };


  const fieldClass = [
    "w-full rounded-lg border px-3 py-3 text-sm outline-none transition-colors",
    light
      ? "border-neutral-300 bg-[#eeece7] text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-950"
      : "border-neutral-800 bg-neutral-950 text-white placeholder:text-neutral-600 focus:border-white",
  ].join(" ");

  const labelClass = [
    "mb-2 block text-xs font-medium uppercase tracking-[0.16em]",
    "text-neutral-500",
  ].join(" ");

  return (
    <div
      className={[
        "w-full min-w-0",
        "transition-colors duration-300",
        light
          ? "bg-transparent text-neutral-950"
          : "bg-neutral-950 text-white",
      ].join(" ")}
    >
      {/* Header */}
      <header
        className={[
          "flex w-full flex-col gap-6 pb-8",
          "sm:flex-row sm:items-end sm:justify-between",
          light ? "border-neutral-300" : "border-neutral-800",
        ].join(" ")}
      >
        <div>
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
            Settings
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={savingFooter || loadingFooter}
          className={[
            "inline-flex h-11 shrink-0 items-center justify-center gap-2",
            "rounded-xl px-5 text-sm font-medium transition-colors",
            light
              ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
              : "bg-white text-neutral-950 hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500",
          ].join(" ")}
        >
          {savingFooter ? (
            "Saving..."
          ) : saved ? (
            <>
              <Check size={17} />
              Saved
            </>
          ) : (
            <>
              <Save size={17} />
              Save Changes
            </>
          )}
        </button>
      </header>

      {saveError && (
        <div
          role="alert"
          className={[
            "mb-8 flex w-full items-start gap-3 rounded-xl border px-4 py-4",
            "text-sm",
            light
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-red-900/60 bg-red-950/30 text-red-300",
          ].join(" ")}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium">Unable to save settings</p>
            <p
              className={[
                "mt-1 break-words text-xs",
                light ? "text-red-700" : "text-red-400",
              ].join(" ")}
            >
              {saveError}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSaveError("")}
            aria-label="Dismiss error"
            className={[
              "shrink-0 rounded-md px-2 py-1 text-xs transition-colors",
              light
                ? "text-red-700 hover:bg-red-100"
                : "text-red-400 hover:bg-red-900/30",
            ].join(" ")}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Logo */}
      <section
        className={[
          "w-full border-b py-10",
          light ? "border-neutral-300" : "border-neutral-800",
        ].join(" ")}
      >
        <div className="grid w-full gap-10 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-lg font-medium">
              Logo
            </h2>

            <p
              className={[
                "mt-2 max-w-xs text-sm leading-6",
                light
                  ? "text-neutral-500"
                  : "text-neutral-500",
              ].join(" ")}
            >
              Change the logo used across the public
              TboyArts website and email branding.
            </p>
          </div>

          <div className="min-w-0 w-full">
            <div
              className={[
                "rounded-2xl border p-5 sm:p-6",
                light
                  ? "border-neutral-300 bg-[#eeece7]"
                  : "border-neutral-800 bg-neutral-950",
              ].join(" ")}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div
                  className={[
                    "flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
                    light
                      ? "border-neutral-300 bg-white"
                      : "border-neutral-800 bg-neutral-900",
                  ].join(" ")}
                >
                  {logoExists && !loadingLogo ? (
                    <img
                      src={`${publicLogoUrl}?admin-preview=${Date.now()}`}
                      alt="TboyArts logo"
                      className="h-full w-full object-contain p-3"
                      onError={() => setLogoExists(false)}
                    />
                  ) : (
                    <Image
                      size={28}
                      className={
                        light
                          ? "text-neutral-400"
                          : "text-neutral-600"
                      }
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {logoExists
                      ? "Current logo"
                      : "No uploaded logo"}
                  </p>

                  <p
                    className={[
                      "mt-1 text-sm leading-6",
                      light
                        ? "text-neutral-500"
                        : "text-neutral-500",
                    ].join(" ")}
                  >
                    PNG, JPEG or WebP. Maximum file size:
                    5MB.
                  </p>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        logoInputRef.current?.click()
                      }
                      disabled={uploadingLogo}
                      className={[
                        "inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        light
                          ? "bg-neutral-950 text-white hover:bg-neutral-800 disabled:bg-neutral-300"
                          : "bg-white text-neutral-950 hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500",
                      ].join(" ")}
                    >
                      <Upload size={16} />
                      {uploadingLogo
                        ? "Uploading..."
                        : logoExists
                          ? "Replace Logo"
                          : "Upload Logo"}
                    </button>

                  </div>

                  {logoMessage && (
                    <p className="mt-4 text-sm text-emerald-500">
                      {logoMessage}
                    </p>
                  )}

                  {logoError && (
                    <p className="mt-4 break-words text-sm text-red-500">
                      {logoError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section
        className={[
          "w-full border-b py-10",
          light ? "border-neutral-300" : "border-neutral-800",
        ].join(" ")}
      >
        <div className="grid w-full gap-10 lg:grid-cols-[280px_1fr]">
          <div>
            <h2 className="text-lg font-medium">
              Footer
            </h2>
          </div>

          <div className="min-w-0 w-full">
            {/* Contact */}
            <div className="w-full">
              <h3
                className={[
                  "mb-7 text-xs font-semibold uppercase tracking-[0.2em]",
                  light ? "text-neutral-500" : "text-neutral-600",
                ].join(" ")}
              >
                Contact Information
              </h3>

              <div className="grid w-full gap-8 md:grid-cols-2">
                <label>
                  <span className={labelClass}>Email</span>

                  <input
                    type="email"
                    value={footer.contact_email}
                    onChange={(event) =>
                      updateFooter({
                        contact_email: event.target.value,
                      })
                    }
                    placeholder="hello@tboyarts.com"
                    className={fieldClass}
                  />
                </label>

                <label>
                  <span className={labelClass}>Phone</span>

                  <input
                    type="tel"
                    value={footer.contact_phone}
                    onChange={(event) =>
                      updateFooter({
                        contact_phone: event.target.value,
                      })
                    }
                    placeholder="+234..."
                    className={fieldClass}
                  />
                </label>

                <label className="md:col-span-2">
                  <span className={labelClass}>Address</span>

                  <input
                    type="text"
                    value={footer.contact_address}
                    onChange={(event) =>
                      updateFooter({
                        contact_address: event.target.value,
                      })
                    }
                    placeholder="Lagos, Nigeria"
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>

            {/* Social */}
            <div
              className={[
                "mt-12 border-t pt-10",
                light ? "border-neutral-300" : "border-neutral-800",
              ].join(" ")}
            >
              <h3
                className={[
                  "mb-7 text-xs font-semibold uppercase tracking-[0.2em]",
                  light ? "text-neutral-500" : "text-neutral-600",
                ].join(" ")}
              >
                Social Links
              </h3>

              <div className="grid w-full gap-x-8 gap-y-8 md:grid-cols-2">
                {[
                  {
                    key: "instagram_url",
                    icon: faInstagram,
                    label: "Instagram",
                    placeholder: "Instagram link",
                  },
                  {
                    key: "facebook_url",
                    icon: faFacebookF,
                    label: "Facebook",
                    placeholder: "Facebook link",
                  },
                  {
                    key: "x_url",
                    icon: faXTwitter,
                    label: "X",
                    placeholder: "X link",
                  },
                  {
                    key: "whatsapp_url",
                    icon: faWhatsapp,
                    label: "WhatsApp",
                    placeholder: "WhatsApp link",
                  },
                ].map((social) => (
                  <label key={social.key}>
                    <span className={labelClass}>
                      {social.label}
                    </span>

                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon
                        icon={social.icon}
                        className="text-neutral-500"
                      />

                      <input
                        type="url"
                        value={
                          footer[
                            social.key as keyof FooterSettings
                          ] as string
                        }
                        onChange={(event) =>
                          updateFooter({
                            [social.key]: event.target.value,
                          } as Partial<FooterSettings>)
                        }
                        placeholder={social.placeholder}
                        className={fieldClass}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
