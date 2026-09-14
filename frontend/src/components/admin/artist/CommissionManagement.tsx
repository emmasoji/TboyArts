import { useEffect, useState } from "react";
import ErrorState from "../../errors/ErrorState";
import { supabase } from "../../../lib/supabase";

interface CommissionSettings {
  id: string;
  commission_label: string;
  commission_heading: string;
  commission_description: string;
  commission_button_text: string;
  commission_button_url: string;
}

export default function CommissionManagement() {
  const [settings, setSettings] =
    useState<CommissionSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] =
    useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      setLoadError(null);

      const { data, error } = await supabase
        .from("artist_page_settings")
        .select(
          "id, commission_label, commission_heading, commission_description, commission_button_text, commission_button_url",
        )
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        setSettings({
          id: "",
          commission_label: "Commissions",
          commission_heading:
            "Create something personal.",
          commission_description:
            "Have an idea, memory, or vision? Commission a custom artwork created with your story in mind.",
          commission_button_text:
            "Request Commission",
          commission_button_url: "#",
        });
      }
    } catch (err) {
      console.error(
        "Failed to load commission settings:",
        err,
      );

      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load commission settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof CommissionSettings,
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
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
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
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        const { error } = await supabase
          .from("artist_page_settings")
          .update(payload)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("artist_page_settings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setSettings({
            ...settings,
            id: data.id,
          });
        }
      }

      setMessage(
        "Commission settings saved successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to save commission settings:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save commission settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 sm:p-8">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          <div className="h-8 w-40 animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--admin-surface-muted)]" />
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
          </div>

          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-[var(--admin-surface-muted)]" />
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
        title="Unable to Load Commission Settings"
        message={
          loadError ||
          "We couldn't load the commission settings. Please check your internet connection and try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadSettings();
        }}
      />
    );
  }

  if (!settings) return null;

  return (
    <div className="rounded-3xl border border-white/5 bg-[#111113] p-6 sm:p-8">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
          Artist
        </p>

        <h3 className="font-serif text-2xl text-white sm:text-3xl">
          Commission
        </h3>

        <p className="mt-2 text-sm text-white/40">
          Manage the custom artwork invitation shown at
          the bottom of the Artist page.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">
            Label
          </label>

          <input
            value={settings.commission_label}
            onChange={(e) =>
              updateField(
                "commission_label",
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">
            Heading
          </label>

          <input
            value={settings.commission_heading}
            onChange={(e) =>
              updateField(
                "commission_heading",
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">
            Description
          </label>

          <textarea
            value={settings.commission_description}
            onChange={(e) =>
              updateField(
                "commission_description",
                e.target.value,
              )
            }
            rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">
              Button Text
            </label>

            <input
              value={settings.commission_button_text}
              onChange={(e) =>
                updateField(
                  "commission_button_text",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/35">
              Button URL
            </label>

            <input
              value={settings.commission_button_url}
              onChange={(e) =>
                updateField(
                  "commission_button_url",
                  e.target.value,
                )
              }
              placeholder="/contact"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/20 bg-red-500/5 text-red-300"
              : "border-green-500/20 bg-green-500/5 text-green-300"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="mt-8 flex justify-end border-t border-white/5 pt-6">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Commission"}
        </button>
      </div>
    </div>
  );
}
