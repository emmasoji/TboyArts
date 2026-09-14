import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import {
  getArtistPageSettings,
  saveArtistPageSettings,
} from "../../../services/artistService";

interface FormState {
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
}

const defaults: FormState = {
  story_label: "My Story",
  story_heading:
    "Every artwork carries a story.",
  philosophy_label: "Philosophy",
  philosophy_heading:
    "The ideas behind the art",
  process_label: "The Process",
  process_heading:
    "From idea to canvas",
  selected_works_label: "Selected Works",
  selected_works_heading:
    "A selection of my work",
  commission_label: "Commissions",
  commission_heading:
    "Create something personal.",
  commission_description:
    "Have an idea for an artwork? Get in touch and let us create something meaningful together.",
  commission_button_text:
    "Discuss a Commission",
  commission_button_url: "#",
};

export default function ArtistPageSettingsEditor() {
  const [form, setForm] =
    useState<FormState>(defaults);

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

        const settings =
          await getArtistPageSettings();

        if (settings) {
          setForm({
            story_label:
              settings.story_label,
            story_heading:
              settings.story_heading,
            philosophy_label:
              settings.philosophy_label,
            philosophy_heading:
              settings.philosophy_heading,
            process_label:
              settings.process_label,
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
        }
      } catch (error) {
        console.error(
          "Failed to load artist page settings:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function update(
    key: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await saveArtistPageSettings(form);

      setMessage(
        "Page settings saved successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to save artist page settings:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-10">
        {Array.from({ length: 4 }).map((_, groupIndex) => (
          <div key={groupIndex} className="space-y-5">
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--admin-surface-muted)]" />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>

              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
              </div>

              {groupIndex >= 2 && (
                <div className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
                  <div className="h-28 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <ErrorState
        type="network"
        title="Unable to Load Artist Page Settings"
        message={
          loadError ||
          "We couldn't load the Artist page settings. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* STORY */}

      <EditorGroup title="My Story">
        <Field
          label="Section Label"
          value={form.story_label}
          onChange={(value) =>
            update("story_label", value)
          }
        />

        <Field
          label="Heading"
          value={form.story_heading}
          onChange={(value) =>
            update("story_heading", value)
          }
        />
      </EditorGroup>

      {/* PHILOSOPHY */}

      <EditorGroup title="Philosophy">
        <Field
          label="Section Label"
          value={form.philosophy_label}
          onChange={(value) =>
            update(
              "philosophy_label",
              value,
            )
          }
        />

        <Field
          label="Heading"
          value={form.philosophy_heading}
          onChange={(value) =>
            update(
              "philosophy_heading",
              value,
            )
          }
        />
      </EditorGroup>

      {/* PROCESS */}

      <EditorGroup title="Process">
        <Field
          label="Section Label"
          value={form.process_label}
          onChange={(value) =>
            update(
              "process_label",
              value,
            )
          }
        />

        <Field
          label="Heading"
          value={form.process_heading}
          onChange={(value) =>
            update(
              "process_heading",
              value,
            )
          }
        />
      </EditorGroup>

      {/* EXHIBITION */}

      <EditorGroup title="Exhibition">
        <Field
          label="Section Label"
          value={form.selected_works_label}
          onChange={(value) =>
            update(
              "selected_works_label",
              value,
            )
          }
        />

        <Field
          label="Heading"
          value={
            form.selected_works_heading
          }
          onChange={(value) =>
            update(
              "selected_works_heading",
              value,
            )
          }
        />
      </EditorGroup>

      {/* COMMISSION */}

      <EditorGroup title="Commission">
        <Field
          label="Section Label"
          value={form.commission_label}
          onChange={(value) =>
            update(
              "commission_label",
              value,
            )
          }
        />

        <Field
          label="Heading"
          value={form.commission_heading}
          onChange={(value) =>
            update(
              "commission_heading",
              value,
            )
          }
        />

        <Field
          label="Description"
          value={
            form.commission_description
          }
          onChange={(value) =>
            update(
              "commission_description",
              value,
            )
          }
          textarea
        />

        <Field
          label="Button Text"
          value={
            form.commission_button_text
          }
          onChange={(value) =>
            update(
              "commission_button_text",
              value,
            )
          }
        />

        <Field
          label="Button URL"
          value={
            form.commission_button_url
          }
          onChange={(value) =>
            update(
              "commission_button_url",
              value,
            )
          }
        />
      </EditorGroup>

      {/* SAVE */}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
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
          {saving
            ? "Saving..."
            : "Save Page Settings"}
        </button>

        {message && (
          <span className="text-sm text-white/50">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

function EditorGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-medium text-white">
          {title}
        </h4>
      </div>

      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
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
          rows={5}
          className={className}
        />
      ) : (
        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={className}
        />
      )}
    </label>
  );
}
