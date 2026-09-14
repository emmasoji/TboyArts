import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import {
  getArtistProfile,
  saveArtistProfile,
} from "../../../services/artistService";

export default function ArtistProfileEditor() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [heroText, setHeroText] = useState("");
  const [story, setStory] = useState("");
  const [profileImage, setProfileImage] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoadError(null);

        const profile =
          await getArtistProfile();

        if (profile) {
          setName(profile.name);
          setTagline(profile.tagline);
          setHeroText(profile.hero_text);
          setStory(profile.story);
          setProfileImage(
            profile.profile_image ?? "",
          );
        }
      } catch (error) {
        console.error(
          "Failed to load artist profile:",
          error,
        );
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load artist profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await saveArtistProfile({
        name,
        tagline,
        hero_text: heroText,
        story,
        profile_image:
          profileImage || null,
      });

      setMessage("Profile saved successfully.");
    } catch (error) {
      console.error(
        "Failed to save artist profile:",
        error,
      );
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div
              className={[
                "w-full animate-pulse rounded-xl",
                index >= 2
                  ? "h-32"
                  : "h-12",
                "bg-[var(--admin-surface-muted)]",
              ].join(" ")}
            />
          </div>
        ))}

        <div className="h-12 w-32 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load Artist Profile"
        message={
          loadError ||
          "We couldn't load the artist profile. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Field
        label="Artist Name"
        value={name}
        onChange={setName}
        placeholder="The Artist"
      />

      <Field
        label="Tagline"
        value={tagline}
        onChange={setTagline}
        placeholder="Creating stories through colour, emotion & imagination."
      />

      <Field
        label="Hero Text"
        value={heroText}
        onChange={setHeroText}
        textarea
        placeholder="Every artwork begins with an idea..."
      />

      <Field
        label="My Story"
        value={story}
        onChange={setStory}
        textarea
        rows={8}
        placeholder="Every artwork carries a story..."
      />

      <Field
        label="Profile Image URL"
        value={profileImage}
        onChange={setProfileImage}
        placeholder="https://..."
      />

      <SaveButton
        saving={saving}
        message={message}
        onClick={handleSave}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea = false,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  const className = `
    w-full
    rounded-xl
    border
    border-white/10
    bg-white/[0.03]
    px-4
    py-3
    text-sm
    text-white
    outline-none
    transition
    placeholder:text-white/20
    focus:border-white/25
  `;

  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/40">
        {label}
      </span>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          rows={rows}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

function SaveButton({
  saving,
  message,
  onClick,
}: {
  saving: boolean;
  message: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="
          rounded-xl
          bg-white
          px-5
          py-3
          text-sm
          font-medium
          text-black
          transition
          hover:bg-white/90
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>

      {message && (
        <span className="text-sm text-white/50">
          {message}
        </span>
      )}
    </div>
  );
}
