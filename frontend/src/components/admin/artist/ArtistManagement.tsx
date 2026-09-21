import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ListFilter,
  Save,
  ImagePlus,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import API_URL from "../../../config/api";
import ErrorState from "../../errors/ErrorState";

import {
  getArtistProfile,
  updateArtistProfile,
  type ArtistProfile,
} from "../../../services/artistService";

type Section = "profile";

const sections: {
  id: Section;
  label: string;
}[] = [
  { id: "profile", label: "Profile & Hero" },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25";

const textareaClass =
  "min-h-[140px] w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-white/25";

const labelClass =
  "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/40";

export default function ArtistManagement() {
  const [activeSection, setActiveSection] =
    useState<Section>("profile");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [profile, setProfile] =
    useState<ArtistProfile>({
      id: "",
      name: "The Artist",
      tagline:
        "Creating stories through colour, emotion & imagination.",
      hero_text:
        "Every artwork begins with an idea, grows through emotion, and becomes a story on canvas.",
      story: "",
      profile_image: null,
      updated_at: "",
    });



  const STORAGE_BUCKET = "artist-images";

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    clearStatus();

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(URL.createObjectURL(file));
  }

  function clearSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) {
      return profile.profile_image;
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      throw new Error(
        "Authentication required before uploading the artist image.",
      );
    }

    const storageResponse = await fetch(
      `${API_URL}/api/admin/storage/usage`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!storageResponse.ok) {
      throw new Error(
        "Unable to verify available storage. Upload cancelled.",
      );
    }

    const storageData = await storageResponse.json();

    if (!storageData.success) {
      throw new Error(
        storageData.message ||
          "Unable to verify available storage. Upload cancelled.",
      );
    }

    if (
      storageData.usedBytes >= storageData.limitBytes ||
      storageData.usedBytes + imageFile.size >
        storageData.limitBytes
    ) {
      throw new Error(
        "Storage limit reached. This artist image cannot be uploaded.",
      );
    }

    const extension =
      imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath =
      `profile/artist-${Date.now()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, imageFile, {
          cacheControl: "2592000",
          upsert: false,
          contentType: imageFile.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } =
      supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl || null;
  }

  const displayedImage =
    imagePreview || profile.profile_image;


  useEffect(() => {
    loadArtist();
  }, []);

  async function loadArtist() {
    try {
      setLoading(true);
      setLoadError(null);

      const profileData = await getArtistProfile();

      if (profileData) {
        setProfile(profileData);
      }


    } catch (err) {
      console.error(
        "Failed to load artist management:",
        err,
      );

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load artist content.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearStatus() {
    setMessage("");
    setError("");
  }

  async function saveProfile() {
    try {
      setSaving(true);
      clearStatus();

      let finalImage = profile.profile_image;

      if (imageFile) {
        finalImage = await uploadImage();
      }

      const oldImageUrl = profile.profile_image;

      const saved = await updateArtistProfile({
        name: profile.name,
        tagline: profile.tagline,
        hero_text: profile.hero_text,
        story: profile.story,
        profile_image: finalImage,
      });

      if (
        imageFile &&
        oldImageUrl &&
        finalImage &&
        finalImage !== oldImageUrl
      ) {
        try {
          const marker =
            "/storage/v1/object/public/";

          const markerIndex =
            oldImageUrl.indexOf(marker);

          if (markerIndex !== -1) {
            const storagePath =
              decodeURIComponent(
                oldImageUrl.slice(
                  markerIndex + marker.length,
                ),
              );

            const bucketMarker = storagePath.indexOf("/");

            if (bucketMarker !== -1) {
              const bucket =
                storagePath.slice(0, bucketMarker);

              const oldFilePath =
                storagePath.slice(bucketMarker + 1);

              if (bucket && oldFilePath) {
                const { error: storageError } =
                  await supabase.storage
                    .from(bucket)
                    .remove([oldFilePath]);

                if (storageError) {
                  console.error(
                    "Artist image replacement cleanup failed:",
                    storageError,
                  );
                }
              }
            }
          }
        } catch (storageError) {
          console.error(
            "Artist image replacement cleanup failed:",
            storageError,
          );
        }
      }

      setProfile(saved);
      clearSelectedImage();

      setMessage("Artist profile saved successfully.");
      await loadArtist();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save artist profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedSection =
    sections.find(
      (section) =>
        section.id === activeSection,
    );

  if (loading) {
    return (
      <section className="space-y-8">
        <div>
          <div className="mb-3 h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="h-10 w-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-28 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]"
            />
          ))}
        </div>

        <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 sm:p-8">
          <div className="space-y-5">
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          </div>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load Artist Management"
        message={
          loadError ||
          "We couldn't load the artist management content. Please check your internet connection and try again."
        }
        actionLabel="Refresh"
        onAction={() => {
          void loadArtist();
        }}
      />
    );
  }

  return (
    <section className="space-y-8">
      {/* HEADER */}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Content
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl">
          Artist
        </h2>

        <p className="mt-2 text-sm text-white/40">
          Manage everything displayed on the
          public artist page.
        </p>
      </div>

      {/* FILTER */}

      <div className="relative w-full sm:w-auto">
        <button
          type="button"
          onClick={() =>
            setFilterOpen(
              (current) => !current,
            )
          }
          className="
            flex
            w-full
            items-center
            justify-between
            gap-4
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-3
            text-sm
            transition
            hover:bg-white/[0.05]
            sm:w-72
          "
          aria-expanded={filterOpen}
        >
          <span className="flex items-center gap-3">
            <ListFilter
              size={17}
              className="text-white/40"
            />

            <span className="font-medium text-white">
              {selectedSection?.label}
            </span>
          </span>

          <ChevronDown
            size={17}
            className={`text-white/40 transition ${
              filterOpen
                ? "rotate-180"
                : ""
            }`}
          />
        </button>

        {filterOpen && (
          <div
            className="
              absolute
              left-0
              top-full
              z-50
              mt-2
              w-full
              overflow-hidden
              rounded-xl
              border
              border-white/10
              bg-[#111113]
              p-1
              shadow-2xl
              sm:w-72
            "
          >
            {sections.map(
              (section) => {
                const active =
                  activeSection ===
                  section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(
                        section.id,
                      );
                      setFilterOpen(false);
                      clearStatus();
                    }}
                    className={`
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-3
                      text-left
                      text-sm
                      transition
                      ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <span className="flex-1">
                      {section.label}
                    </span>

                    {active && (
                      <Check
                        size={16}
                        className="text-white/70"
                      />
                    )}
                  </button>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* PROFILE */}

      {activeSection ===
        "profile" && (
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-8">
              <h3 className="font-serif text-2xl">
                Profile & Hero
              </h3>

              <p className="mt-2 text-sm text-white/40">
                These fields power the top
                section of the Artist page.
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className={labelClass}>
                  Artist Name
                </label>

                <input
                  className={`${inputClass} text-lg`}
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      name: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tagline
                </label>

                <input
                  className={inputClass}
                  value={profile.tagline}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      tagline: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Hero Text
                </label>

                <textarea
                  className={textareaClass}
                  value={profile.hero_text}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      hero_text: event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                  Artist Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex min-h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  {displayedImage ? (
                    <img
                      src={displayedImage}
                      alt="Artist preview"
                      className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                        <ImagePlus
                          size={20}
                          className="text-white/50"
                        />
                      </div>

                      <span className="text-sm font-medium text-white">
                        Choose an image
                      </span>

                      <span className="mt-2 text-xs text-white/30">
                        JPG, PNG, WEBP · Maximum 10MB
                      </span>
                    </div>
                  )}

                  {displayedImage && (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-black/60 px-4 py-3 backdrop-blur-sm">
                      <p className="text-xs font-medium text-white">
                        Click to change image
                      </p>
                    </div>
                  )}
                </button>

                {imageFile && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="truncate text-xs text-white/60">
                      {imageFile.name}
                    </span>

                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="ml-3 shrink-0 text-white/30 transition hover:text-white"
                      aria-label="Remove selected image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <SaveButton
              saving={saving}
              onClick={saveProfile}
            />
          </div>
        </div>
      )}

      {/* STATUS */}

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/5 text-red-300"
              : "border-green-500/20 bg-green-500/5 text-green-300"
          }`}
        >
          {error || message}
        </div>
      )}
    </section>
  );
}

function SaveButton({
  saving,
  onClick,
}: {
  saving: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-end border-t border-white/5 pt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
