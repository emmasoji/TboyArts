import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ListFilter,
  Plus,
  Save,
  Trash2,
  ImagePlus,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import API_URL from "../../../config/api";
import ErrorState from "../../errors/ErrorState";

import {
  createArtistPhilosophy,
  createArtistProcess,
  deleteArtistPhilosophy,
  deleteArtistProcess,
  getArtistPageSettings,
  getArtistPhilosophy,
  getArtistProcess,
  getArtistProfile,
  updateArtistPageSettings,
  updateArtistPhilosophy,
  updateArtistProcess,
  updateArtistProfile,
  type ArtistPageSettings,
  type ArtistPhilosophy,
  type ArtistProcess,
  type ArtistProfile,
} from "../../../services/artistService";

type Section =
  | "profile"
  | "story"
  | "philosophy"
  | "process"
  | "commission";

const sections: {
  id: Section;
  label: string;
}[] = [
  { id: "profile", label: "Profile & Hero" },
  { id: "story", label: "My Story" },
  { id: "philosophy", label: "Philosophy" },
  { id: "process", label: "Process" },
  { id: "commission", label: "Commission" },
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

  const [settings, setSettings] =
    useState<ArtistPageSettings>({
      id: "",
      story_label: "My Story",
      story_heading:
        "Every artwork carries a story.",
      philosophy_label: "Philosophy",
      philosophy_heading:
        "The ideas behind the art",
      process_label: "The Process",
      process_heading:
        "From idea to canvas",
      selected_works_label:
        "Selected Works",
      selected_works_heading:
        "A selection of my work",
      commission_label:
        "Commissions",
      commission_heading:
        "Create something personal.",
      commission_description:
        "Have an idea for an artwork? Get in touch and let us create something meaningful together.",
      commission_button_text:
        "Discuss a Commission",
      commission_button_url: "#",
      updated_at: "",
    });

  const [philosophy, setPhilosophy] =
    useState<ArtistPhilosophy[]>([]);

  const [process, setProcess] =
    useState<ArtistProcess[]>([]);

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

      const [
        profileData,
        settingsData,
        philosophyData,
        processData,
      ] = await Promise.all([
        getArtistProfile(),
        getArtistPageSettings(),
        getArtistPhilosophy(),
        getArtistProcess(),
      ]);

      if (profileData) {
        setProfile(profileData);
      }

      if (settingsData) {
        setSettings(settingsData);
      }

      setPhilosophy(philosophyData);
      setProcess(processData);
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

  async function saveSettings() {
    try {
      setSaving(true);
      clearStatus();

      await updateArtistPageSettings({
        story_label: settings.story_label,
        story_heading: settings.story_heading,
        philosophy_label:
          settings.philosophy_label,
        philosophy_heading:
          settings.philosophy_heading,
        process_label: settings.process_label,
        process_heading:
          settings.process_heading,
        selected_works_label:
          settings.selected_works_label,
        selected_works_heading:
          settings.selected_works_heading,
        commission_label:
          settings.commission_label,
        commission_heading:
          settings.commission_heading,
        commission_description:
          settings.commission_description,
        commission_button_text:
          settings.commission_button_text,
        commission_button_url:
          settings.commission_button_url,
      });

      setMessage("Artist settings saved successfully.");
      await loadArtist();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save artist settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addPhilosophy() {
    try {
      setSaving(true);
      clearStatus();

      const item =
        await createArtistPhilosophy({
          title: "New Philosophy",
          description:
            "Describe this part of the artistic philosophy.",
          sort_order: philosophy.length,
        });

      setPhilosophy((current) => [
        ...current,
        item,
      ]);

      setMessage("Philosophy item added.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to add philosophy item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePhilosophy(
    item: ArtistPhilosophy,
  ) {
    try {
      setSaving(true);
      clearStatus();

      const updated =
        await updateArtistPhilosophy(
          item.id,
          {
            title: item.title,
            description: item.description,
            sort_order: item.sort_order,
          },
        );

      setPhilosophy((current) =>
        current.map((entry) =>
          entry.id === updated.id
            ? updated
            : entry,
        ),
      );

      setMessage("Philosophy saved.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save philosophy.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removePhilosophy(
    id: string,
  ) {
    try {
      setSaving(true);
      clearStatus();

      await deleteArtistPhilosophy(id);

      setPhilosophy((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );

      setMessage("Philosophy item deleted.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete philosophy item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function addProcess() {
    try {
      setSaving(true);
      clearStatus();

      const item =
        await createArtistProcess({
          title: "New Process Step",
          description:
            "Describe this stage of the creative process.",
          image: null,
          sort_order: process.length,
        });

      setProcess((current) => [
        ...current,
        item,
      ]);

      setMessage("Process step added.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to add process step.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveProcess(
    item: ArtistProcess,
  ) {
    try {
      setSaving(true);
      clearStatus();

      const updated =
        await updateArtistProcess(
          item.id,
          {
            title: item.title,
            description: item.description,
            image: item.image,
            sort_order: item.sort_order,
          },
        );

      setProcess((current) =>
        current.map((entry) =>
          entry.id === updated.id
            ? updated
            : entry,
        ),
      );

      setMessage("Process step saved.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save process step.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeProcess(id: string) {
    try {
      setSaving(true);
      clearStatus();

      await deleteArtistProcess(id);

      setProcess((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );

      setMessage("Process step deleted.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete process step.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updatePhilosophyLocal(
    id: string,
    field:
      | "title"
      | "description",
    value: string,
  ) {
    setPhilosophy((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function updateProcessLocal(
    id: string,
    field:
      | "title"
      | "description"
      | "image",
    value: string,
  ) {
    setProcess((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
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

      {/* STORY */}

      {activeSection === "story" && (
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-8">
              <h3 className="font-serif text-2xl">
                My Story
              </h3>

              <p className="mt-2 text-sm text-white/40">
                Edit the story section shown
                beneath the hero.
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className={labelClass}>
                  Section Label
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.story_label
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      story_label:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Story Heading
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.story_heading
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      story_heading:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Story
                </label>

                <textarea
                  className={`${textareaClass} min-h-[300px]`}
                  value={profile.story}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      story: event.target.value,
                    })
                  }
                  placeholder="Separate paragraphs with a blank line."
                />

                <p className="mt-2 text-xs text-white/25">
                  Use a blank line between
                  paragraphs.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                <Save size={16} />
                {saving
                  ? "Saving..."
                  : "Save Story"}
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/5 disabled:opacity-50"
              >
                <Save size={16} />
                Save Heading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHILOSOPHY */}

      {activeSection ===
        "philosophy" && (
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h3 className="font-serif text-2xl">
                  Philosophy
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  Manage the ideas behind the
                  artwork.
                </p>
              </div>

              <button
                type="button"
                onClick={addPhilosophy}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="mb-8 grid gap-6">
              <div>
                <label className={labelClass}>
                  Section Label
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.philosophy_label
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      philosophy_label:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Section Heading
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.philosophy_heading
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      philosophy_heading:
                        event.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="w-fit rounded-xl border border-white/10 px-5 py-3 text-sm transition hover:bg-white/5 disabled:opacity-50"
              >
                Save Section
              </button>
            </div>

            <div className="space-y-4">
              {philosophy.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                  No philosophy items yet.
                </div>
              ) : (
                philosophy.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                          {String(
                            index + 1,
                          ).padStart(2, "0")}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removePhilosophy(
                              item.id,
                            )
                          }
                          disabled={saving}
                          className="rounded-lg p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>

                      <div className="grid gap-5">
                        <div>
                          <label
                            className={
                              labelClass
                            }
                          >
                            Title
                          </label>

                          <input
                            className={
                              inputClass
                            }
                            value={
                              item.title
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePhilosophyLocal(
                                item.id,
                                "title",
                                event.target
                                  .value,
                              )
                            }
                          />
                        </div>

                        <div>
                          <label
                            className={
                              labelClass
                            }
                          >
                            Description
                          </label>

                          <textarea
                            className={
                              textareaClass
                            }
                            value={
                              item.description
                            }
                            onChange={(
                              event,
                            ) =>
                              updatePhilosophyLocal(
                                item.id,
                                "description",
                                event.target
                                  .value,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            savePhilosophy(
                              item,
                            )
                          }
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/5 disabled:opacity-50"
                        >
                          <Save size={15} />
                          Save
                        </button>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROCESS */}

      {activeSection === "process" && (
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h3 className="font-serif text-2xl">
                  Process
                </h3>

                <p className="mt-2 text-sm text-white/40">
                  Manage the stages from idea
                  to finished artwork.
                </p>
              </div>

              <button
                type="button"
                onClick={addProcess}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                <Plus size={16} />
                Add Step
              </button>
            </div>

            <div className="mb-8 grid gap-6">
              <div>
                <label className={labelClass}>
                  Section Label
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.process_label
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      process_label:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Section Heading
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.process_heading
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      process_heading:
                        event.target.value,
                    })
                  }
                />
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="w-fit rounded-xl border border-white/10 px-5 py-3 text-sm transition hover:bg-white/5 disabled:opacity-50"
              >
                Save Section
              </button>
            </div>

            <div className="space-y-4">
              {process.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">
                  No process steps yet.
                </div>
              ) : (
                process.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                          {String(
                            index + 1,
                          ).padStart(2, "0")}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeProcess(
                              item.id,
                            )
                          }
                          disabled={saving}
                          className="rounded-lg p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>

                      <div className="grid gap-5">
                        <div>
                          <label
                            className={
                              labelClass
                            }
                          >
                            Title
                          </label>

                          <input
                            className={
                              inputClass
                            }
                            value={
                              item.title
                            }
                            onChange={(
                              event,
                            ) =>
                              updateProcessLocal(
                                item.id,
                                "title",
                                event.target
                                  .value,
                              )
                            }
                          />
                        </div>

                        <div>
                          <label
                            className={
                              labelClass
                            }
                          >
                            Description
                          </label>

                          <textarea
                            className={
                              textareaClass
                            }
                            value={
                              item.description
                            }
                            onChange={(
                              event,
                            ) =>
                              updateProcessLocal(
                                item.id,
                                "description",
                                event.target
                                  .value,
                              )
                            }
                          />
                        </div>

                        <div>
                          <label
                            className={
                              labelClass
                            }
                          >
                            Image URL
                          </label>

                          <input
                            className={
                              inputClass
                            }
                            value={
                              item.image ??
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              updateProcessLocal(
                                item.id,
                                "image",
                                event.target
                                  .value,
                              )
                            }
                            placeholder="Optional Supabase Storage URL"
                          />
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            saveProcess(item)
                          }
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm transition hover:bg-white/5 disabled:opacity-50"
                        >
                          <Save size={15} />
                          Save
                        </button>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMISSION */}

      {activeSection ===
        "commission" && (
        <div className="space-y-6">
          <div className="w-full">
            <div className="mb-8">
              <h3 className="font-serif text-2xl">
                Commission
              </h3>

              <p className="mt-2 text-sm text-white/40">
                Manage the custom artwork section.
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className={labelClass}>
                  Label
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.commission_label
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      commission_label:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Heading
                </label>

                <input
                  className={inputClass}
                  value={
                    settings.commission_heading
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      commission_heading:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Description
                </label>

                <textarea
                  className={textareaClass}
                  value={
                    settings.commission_description
                  }
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      commission_description:
                        event.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Button Text
                  </label>

                  <input
                    className={inputClass}
                    value={
                      settings.commission_button_text
                    }
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        commission_button_text:
                          event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Button URL
                  </label>

                  <input
                    className={inputClass}
                    value={
                      settings.commission_button_url
                    }
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        commission_button_url:
                          event.target.value,
                      })
                    }
                    placeholder="/contact"
                  />
                </div>
              </div>
            </div>

            <SaveButton
              saving={saving}
              onClick={saveSettings}
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
