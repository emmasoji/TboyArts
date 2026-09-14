import { useEffect, useRef, useState } from "react";
import {
  Image,
  Save,
  Loader2,
  Upload,
} from "lucide-react";
import {
  getAboutSettings,
  updateAboutSettings,
  type AboutSettings,
} from "../../../../services/homepageService";
import { supabase } from "../../../../lib/supabase";
import ErrorState from "../../../errors/ErrorState";

export default function AboutManagement() {
  const [settings, setSettings] =
    useState<AboutSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setLoadError(null);
        setError("");

        const data = await getAboutSettings();
        setSettings(data);
      } catch (err) {
        console.error(
          "Failed to load about settings:",
          err,
        );

        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load about settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(
    field: keyof AboutSettings,
    value: string,
  ) {
    setSettings((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );

    setMessage("");
    setError("");
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file || !settings) return;

    try {
      setUploading(true);
      setMessage("");
      setError("");

      if (!file.type.startsWith("image/")) {
        throw new Error(
          "Please select an image file.",
        );
      }

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const fileName =
        `about-${Date.now()}.${extension}`;

      const filePath =
        `about/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("homepage")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("homepage")
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error(
          "Could not create a public image URL.",
        );
      }

      updateField(
        "aboutImage",
        publicUrlData.publicUrl,
      );

      setMessage(
        "Image uploaded. Click Save About Settings to apply it.",
      );
    } catch (err) {
      console.error(
        "About image upload failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload about image.",
      );
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await updateAboutSettings(
        settings.id,
        {
          aboutLabel:
            settings.aboutLabel,

          aboutTitle:
            settings.aboutTitle,

          aboutDescription:
            settings.aboutDescription,

          aboutImage:
            settings.aboutImage,

          aboutButtonText:
            settings.aboutButtonText,

          aboutButtonUrl:
            settings.aboutButtonUrl,
        },
      );

      setMessage(
        "About settings saved successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to save about settings:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save about settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="border-b border-[var(--admin-border)] px-6 py-5 sm:px-8">
          <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="mt-3 h-6 w-48 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="aspect-[4/3] w-full max-w-md animate-pulse rounded-2xl bg-[var(--admin-surface-muted)]" />

          <div className="space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          </div>

          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-28 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          </div>

          <div className="h-12 w-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load About Settings"
        message={
          loadError ||
          "We couldn't load the homepage About settings. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          window.location.reload();
        }}
      />
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load About Settings"
        message={
          loadError ||
          "We couldn't load the homepage About settings. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          window.location.reload();
        }}
      />
    );
  }

  if (!settings) {
    return (
      <ErrorState
        type="server"
        title="About Settings Unavailable"
        message="The About section settings could not be loaded."
        actionLabel="Try Again"
        onAction={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="w-full">

      {/* HEADER */}

      <div className="border-b border-white/5 px-6 py-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
          About Section
        </p>

        <h3 className="mt-1 text-xl font-medium text-white/90">
          Homepage About
        </h3>

        <p className="mt-1 text-sm text-white/35">
          Control the About section displayed on the
          homepage.
        </p>
      </div>

      {/* FORM */}

      <div className="p-6 sm:p-8">
        <div className="w-full space-y-6">

          {/* LABEL */}

          <div>
            <label
              htmlFor="about-label"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Eyebrow
            </label>

            <input
              id="about-label"
              type="text"
              value={settings.aboutLabel}
              onChange={(event) =>
                updateField(
                  "aboutLabel",
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25"
              placeholder="ABOUT TBOYARTS"
            />
          </div>

          {/* TITLE */}

          <div>
            <label
              htmlFor="about-title"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Heading
            </label>

            <textarea
              id="about-title"
              rows={4}
              value={settings.aboutTitle}
              onChange={(event) =>
                updateField(
                  "aboutTitle",
                  event.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-white/25"
              placeholder="Where Art Meets Emotion"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="about-description"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Description
            </label>

            <textarea
              id="about-description"
              rows={6}
              value={settings.aboutDescription}
              onChange={(event) =>
                updateField(
                  "aboutDescription",
                  event.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-white/25"
              placeholder="Tell visitors about the artist and the creative vision behind TboyArts."
            />
          </div>

          {/* BUTTON */}

          <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/30">
              About Button
            </p>

            <div className="grid gap-4 sm:grid-cols-2">

              <input
                type="text"
                value={settings.aboutButtonText}
                onChange={(event) =>
                  updateField(
                    "aboutButtonText",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="Meet the Artist"
              />

              <input
                type="text"
                value={settings.aboutButtonUrl}
                onChange={(event) =>
                  updateField(
                    "aboutButtonUrl",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                placeholder="/artist"
              />

            </div>
          </div>

          {/* IMAGE */}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
              About Image
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="group relative h-44 w-72 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {settings.aboutImage ? (
                <>
                  <img
                    src={settings.aboutImage}
                    alt="Current about section"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
                    <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100">
                      {uploading ? (
                        <>
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Replace Image
                        </>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-white/30">
                  {uploading ? (
                    <Loader2
                      size={26}
                      className="animate-spin"
                    />
                  ) : (
                    <Image size={26} />
                  )}

                  <span className="text-xs">
                    {uploading
                      ? "Uploading..."
                      : "Click to upload image"}
                  </span>
                </div>
              )}
            </button>

            <p className="mt-2 text-xs text-white/25">
              Click the image to replace it.
            </p>
          </div>

          {/* MESSAGES */}

          {error && (
            <div className="rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {/* SAVE */}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : "Save About Settings"}
          </button>

        </div>
      </div>
    </div>
  );
}
