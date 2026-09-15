import API_URL from "../../../../config/api";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Mail,
  Save,
  Eye,
  Loader2,
  FileText,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";
import ErrorState from "../../../errors/ErrorState";

interface HomeSettings {
  id: string;
  newsletter_email_subject: string | null;
  newsletter_email_heading: string | null;
  newsletter_email_body: string | null;
  newsletter_email_button_text: string | null;
  newsletter_email_button_url: string | null;
}


function renderMarkdownPreview(markdown: string) {
  const normalized = markdown
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block === "---") {
      return (
        <hr
          key={index}
          className="my-7 border-0 border-t border-black/10"
        />
      );
    }

    if (/^!\[[^\]]*\]\(https?:\/\/[^)\s]+\)$/.test(block)) {
      const match = block.match(
        /^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/
      );

      if (match) {
        return (
          <img
            key={index}
            src={match[2]}
            alt={match[1]}
            className="my-6 block h-auto w-full rounded-lg"
            loading="lazy"
          />
        );
      }
    }

    if (block.startsWith("### ")) {
      return (
        <h3
          key={index}
          className="mb-3 mt-6 text-lg font-semibold text-black"
        >
          {renderInlineMarkdown(block.slice(4))}
        </h3>
      );
    }

    if (block.startsWith("## ")) {
      return (
        <h2
          key={index}
          className="mb-4 mt-7 text-2xl font-semibold text-black"
        >
          {renderInlineMarkdown(block.slice(3))}
        </h2>
      );
    }

    if (block.startsWith("# ")) {
      return (
        <h1
          key={index}
          className="mb-5 text-3xl font-semibold tracking-tight text-black"
        >
          {renderInlineMarkdown(block.slice(2))}
        </h1>
      );
    }

    if (/^(?:[-*+]\s+.+)(?:\n(?:[-*+]\s+.+))*$/.test(block)) {
      return (
        <ul
          key={index}
          className="mb-5 list-disc space-y-2 pl-6 text-[15px] leading-7 text-black/70"
        >
          {block.split("\n").map((line, itemIndex) => (
            <li key={itemIndex}>
              {renderInlineMarkdown(
                line.replace(/^[-*+]\s+/, "")
              )}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p
        key={index}
        className="mb-5 text-[15px] leading-7 text-black/70"
      >
        {renderInlineMarkdown(block)}
      </p>
    );
  });
}

function renderInlineMarkdown(value: string) {
  const parts: ReactNode[] = []
  let remaining = value;
  let key = 0;

  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/;

  while (remaining) {
    const match = remaining.match(pattern);

    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(
        remaining.slice(0, match.index)
      );
    }

    const token = match[0];

    if (
      token.startsWith("**") &&
      token.endsWith("**")
    ) {
      parts.push(
        <strong key={key++}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      token.startsWith("*") &&
      token.endsWith("*")
    ) {
      parts.push(
        <em key={key++}>
          {token.slice(1, -1)}
        </em>
      );
    } else if (
      token.startsWith("`") &&
      token.endsWith("`")
    ) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-black/5 px-1.5 py-0.5 text-[13px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      const link = token.match(
        /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/
      );

      if (link) {
        parts.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {link[1]}
          </a>
        );
      }
    }

    remaining = remaining.slice(
      match.index + token.length
    );
  }

  return parts;
}

export default function WelcomeNewsletter() {
  const [settings, setSettings] =
    useState<HomeSettings | null>(null);

  const [subject, setSubject] = useState("");
  const [heading, setHeading] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const [markdownExists, setMarkdownExists] =
    useState(false);
  const [markdownFileName, setMarkdownFileName] =
    useState("");
  const [markdownContent, setMarkdownContent] =
    useState("");
  const [loadingMarkdown, setLoadingMarkdown] =
    useState(true);
  const [uploadingMarkdown, setUploadingMarkdown] =
    useState(false);
  const [deletingMarkdown, setDeletingMarkdown] =
    useState(false);
  const [markdownError, setMarkdownError] =
    useState("");
  const [markdownLoadError, setMarkdownLoadError] =
    useState<string | null>(null);
  const [markdownMessage, setMarkdownMessage] =
    useState("");

  const markdownInputRef =
    useRef<HTMLInputElement | null>(null);

  const apiBaseUrl =
    API_URL;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadMarkdown();
  }, []);

  async function loadMarkdown() {
    try {
      setLoadingMarkdown(true);
      setMarkdownError("");
      setMarkdownLoadError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session not found.");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/admin/storage/welcome-newsletter`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = await response.json().catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Failed to load newsletter Markdown.",
        );
      }

      setMarkdownExists(Boolean(data?.exists));
      setMarkdownFileName(
        data?.fileName ?? "",
      );
      setMarkdownContent(
        data?.markdown ?? "",
      );
    } catch (error) {
      console.error(
        "Failed to load newsletter Markdown:",
        error,
      );

      setMarkdownLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load newsletter Markdown.",
      );
    } finally {
      setLoadingMarkdown(false);
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("home_settings")
        .select(`
          id,
          newsletter_email_subject,
          newsletter_email_heading,
          newsletter_email_body,
          newsletter_email_button_text,
          newsletter_email_button_url
        `)
        .limit(1)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const row = data as HomeSettings;

      setSettings(row);

      setSubject(row.newsletter_email_subject ?? "");
      setHeading(row.newsletter_email_heading ?? "");
      setMessage(row.newsletter_email_body ?? "");
      setButtonText(row.newsletter_email_button_text ?? "");
      setButtonUrl(row.newsletter_email_button_url ?? "");
    } catch (err) {
      console.error(
        "Failed to load welcome newsletter:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load welcome newsletter.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkdownUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingMarkdown(true);
    setMarkdownError("");
    setMarkdownMessage("");

    try {
      const lowerName =
        file.name.toLowerCase();

      if (
        !lowerName.endsWith(".md") &&
        !lowerName.endsWith(".markdown")
      ) {
        throw new Error(
          "Please select a Markdown (.md) file.",
        );
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error(
          "Markdown file must be smaller than 2MB.",
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
        `${apiBaseUrl}/api/admin/storage/welcome-newsletter`,
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
            "Failed to upload newsletter Markdown.",
        );
      }

      setMarkdownExists(true);
      setMarkdownFileName(
        data?.fileName ?? file.name,
      );

      setMarkdownContent(
        await file.text(),
      );

      setMarkdownMessage(
        "Welcome newsletter Markdown uploaded successfully.",
      );

    } catch (error) {
      console.error(
        "Failed to upload newsletter Markdown:",
        error,
      );

      setMarkdownError(
        error instanceof Error
          ? error.message
          : "Failed to upload newsletter Markdown.",
      );
    } finally {
      setUploadingMarkdown(false);

      if (markdownInputRef.current) {
        markdownInputRef.current.value = "";
      }
    }
  }

  async function handleMarkdownDelete() {
    if (!markdownExists) return;

    const confirmed = window.confirm(
      "Delete the uploaded welcome newsletter Markdown file?",
    );

    if (!confirmed) return;

    setDeletingMarkdown(true);
    setMarkdownError("");
    setMarkdownMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Admin session not found.");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/admin/storage/welcome-newsletter`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      const data = await response.json().catch(
        () => null,
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Failed to delete newsletter Markdown.",
        );
      }

      setMarkdownExists(false);
      setMarkdownFileName("");
      setMarkdownContent("");

      setMarkdownMessage(
        "Welcome newsletter Markdown deleted. The saved Message field will be used as the fallback.",
      );
    } catch (error) {
      console.error(
        "Failed to delete newsletter Markdown:",
        error,
      );

      setMarkdownError(
        error instanceof Error
          ? error.message
          : "Failed to delete newsletter Markdown.",
      );
    } finally {
      setDeletingMarkdown(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const { error } = await supabase
        .from("home_settings")
        .update({
          newsletter_email_subject: subject,
          newsletter_email_heading: heading,
          newsletter_email_body: message,
          newsletter_email_button_text: buttonText,
          newsletter_email_button_url: buttonUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) {
        throw new Error(error.message);
      }

      setSettings({
        ...settings,
        newsletter_email_subject: subject,
        newsletter_email_heading: heading,
        newsletter_email_body: message,
        newsletter_email_button_text: buttonText,
        newsletter_email_button_url: buttonUrl,
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(
        "Failed to save welcome newsletter:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save newsletter.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    const previewWindow = window.open(
      "",
      "_blank",
      "width=700,height=800",
    );

    if (!previewWindow) return;

    previewWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(subject)}</title>
          <style>
            body {
              margin: 0;
              padding: 40px 20px;
              background: #0d0d0f;
              color: #ffffff;
              font-family: Arial, sans-serif;
            }

            .email {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px;
              background: #151517;
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 20px;
            }

            .label {
              font-size: 11px;
              letter-spacing: 3px;
              text-transform: uppercase;
              color: rgba(255,255,255,0.4);
              margin-bottom: 20px;
            }

            h1 {
              font-size: 32px;
              font-weight: 500;
              margin: 0 0 24px;
            }

            p {
              color: rgba(255,255,255,0.65);
              line-height: 1.8;
              white-space: pre-line;
            }

            a {
              display: inline-block;
              margin-top: 20px;
              padding: 14px 22px;
              background: #ffffff;
              color: #000000;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 500;
            }
          </style>
        </head>

        <body>
          <div class="email">
            <div class="label">TboyArts Newsletter</div>

            <h1>${escapeHtml(heading)}</h1>

            <p>${escapeHtml(message)}</p>

            <a href="${escapeHtml(buttonUrl)}">
              ${escapeHtml(buttonText)}
            </a>
          </div>
        </body>
      </html>
    `);

    previewWindow.document.close();
  }

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />

          <div className="mt-3 h-7 w-48 animate-pulse rounded-lg bg-white/10" />

          <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded bg-white/5" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          {/* Subject */}
          <div>
            <div className="mb-2 h-3 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
          </div>

          {/* Heading */}
          <div className="mt-5">
            <div className="mb-2 h-3 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
          </div>

          {/* Message */}
          <div className="mt-5">
            <div className="mb-2 h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />
          </div>

          {/* Buttons */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
            </div>

            <div>
              <div className="mb-2 h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-white/5" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="h-11 w-28 animate-pulse rounded-xl bg-white/10" />
            <div className="h-11 w-24 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="space-y-6">

      {/* HEADER */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
          Newsletter
        </p>

        <h3 className="mt-1 text-xl font-medium">
          Welcome Newsletter
        </h3>

        <p className="mt-1 text-sm text-white/40">
          Manage the welcome email sent to new subscribers.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <ErrorState
          type="server"
          title="Unable to Load Welcome Newsletter"
          message={
            error ||
            "We couldn't load the welcome newsletter settings right now. Please try again."
          }
          actionLabel="Try Again"
          onAction={() => {
            void loadSettings();
          }}
        />
      )}

      {/* MARKDOWN SOURCE */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 rounded-lg border border-white/10 bg-white/[0.04] p-2">
              <FileText
                size={17}
                className="text-white/50"
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-medium">
                Markdown Newsletter Source
              </h4>

              <p className="mt-1 max-w-xl text-xs leading-5 text-white/35">
                Upload a .md file to use as the welcome
                newsletter message. A newly uploaded file
                replaces the previous one.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <input
              ref={markdownInputRef}
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              onChange={handleMarkdownUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                markdownInputRef.current?.click()
              }
              disabled={
                uploadingMarkdown ||
                deletingMarkdown
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-4
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
              {uploadingMarkdown ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Upload size={16} />
              )}

              {uploadingMarkdown
                ? "Uploading..."
                : markdownExists
                  ? "Replace .md"
                  : "Upload .md"}
            </button>

            {markdownExists && (
              <button
                type="button"
                onClick={handleMarkdownDelete}
                disabled={
                  uploadingMarkdown ||
                  deletingMarkdown
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  px-4
                  py-3
                  text-sm
                  text-white/60
                  transition
                  hover:border-red-400/20
                  hover:bg-red-400/5
                  hover:text-red-400
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {deletingMarkdown ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {deletingMarkdown
                  ? "Deleting..."
                  : "Delete"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                Current Source
              </p>

              <p className="mt-1 truncate text-sm text-white/65">
                {loadingMarkdown
                  ? "Checking..."
                  : markdownExists
                    ? markdownFileName
                    : "No Markdown file uploaded"}
              </p>
            </div>

            <button
              type="button"
              onClick={loadMarkdown}
              disabled={
                loadingMarkdown ||
                uploadingMarkdown ||
                deletingMarkdown
              }
              aria-label="Refresh Markdown source"
              className="shrink-0 rounded-lg border border-white/10 p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              <RefreshCw
                size={15}
                className={
                  loadingMarkdown
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>

        {markdownLoadError && (
          <div className="mt-5">
            <ErrorState
              type="server"
              title="Unable to Load Markdown Source"
              message={
                markdownLoadError ||
                "We couldn't load the welcome newsletter Markdown source. Please try again."
              }
              actionLabel="Try Again"
              onAction={() => {
                void loadMarkdown();
              }}
            />
          </div>
        )}

        {markdownExists && markdownContent && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
                  Live Email Preview
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Previewing the uploaded Markdown newsletter.
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                Markdown source
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#e9e9e9] shadow-2xl">
              <div className="border-b border-black/10 bg-[#f5f5f5] px-4 py-3">
                <div className="mx-auto max-w-[640px]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/35">
                    Email Preview
                  </p>

                  <p className="mt-1 truncate text-xs text-black/55">
                    {subject || "Welcome to TboyArts"}
                  </p>
                </div>
              </div>

              <div className="max-h-[760px] overflow-auto p-4 sm:p-8">
                <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl bg-white shadow-xl">

                  <div className="border-b border-black/5 px-6 py-7 text-center sm:px-10">
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/Logo/logo.png`}
                      alt="TboyArts"
                      className="mx-auto h-16 w-16 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35">
                      TboyArts
                    </p>
                  </div>

                  <div className="px-6 py-8 sm:px-10">
                    {heading && (
                      <h2 className="mb-7 text-center text-2xl font-semibold tracking-tight text-black">
                        {heading}
                      </h2>
                    )}

                    <div>
                      {renderMarkdownPreview(
                        markdownContent
                      )}
                    </div>

                    {buttonText && (
                      <div className="mt-8 text-center">
                        <span className="inline-block rounded-lg bg-black px-6 py-3 text-sm font-medium text-white">
                          {buttonText}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-black/5 px-6 py-6 text-center sm:px-10">
                    <p className="text-[11px] leading-5 text-black/35">
                      You are receiving this email because you subscribed to TboyArts.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {markdownMessage && (
          <p className="mt-4 text-sm text-emerald-400">
            {markdownMessage}
          </p>
        )}

        {markdownError && (
          <p className="mt-4 break-words text-sm text-red-400">
            {markdownError}
          </p>
        )}
      </div>

      {/* EDITOR */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

        {/* SUBJECT */}

        <div>
          <label
            htmlFor="welcome-subject"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35"
          >
            Email Subject
          </label>

          <input
            id="welcome-subject"
            type="text"
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
            className="
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
              focus:border-white/20
              focus:bg-white/[0.05]
            "
            placeholder="Welcome to TboyArts"
          />
        </div>

        {/* HEADING */}

        <div className="mt-5">
          <label
            htmlFor="welcome-heading"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35"
          >
            Email Heading
          </label>

          <input
            id="welcome-heading"
            type="text"
            value={heading}
            onChange={(event) =>
              setHeading(event.target.value)
            }
            className="
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
              focus:border-white/20
              focus:bg-white/[0.05]
            "
            placeholder="Welcome to TboyArts"
          />
        </div>

        {/* MESSAGE */}

        <div className="mt-5">
          <label
            htmlFor="welcome-message"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35"
          >
            Message
          </label>

          <textarea
            id="welcome-message"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            rows={12}
            className="
              w-full
              resize-y
              rounded-xl
              border
              border-white/10
              bg-white/[0.03]
              px-4
              py-3
              text-sm
              leading-6
              text-white
              outline-none
              transition
              placeholder:text-white/20
              focus:border-white/20
              focus:bg-white/[0.05]
            "
            placeholder="Write your welcome message..."
          />
        </div>

        {/* BUTTON */}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          <div>
            <label
              htmlFor="welcome-button-text"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35"
            >
              Button Text
            </label>

            <input
              id="welcome-button-text"
              type="text"
              value={buttonText}
              onChange={(event) =>
                setButtonText(event.target.value)
              }
              className="
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
                focus:border-white/20
                focus:bg-white/[0.05]
              "
              placeholder="Explore the Gallery"
            />
          </div>

          <div>
            <label
              htmlFor="welcome-button-url"
              className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35"
            >
              Button URL
            </label>

            <input
              id="welcome-button-url"
              type="text"
              value={buttonUrl}
              onChange={(event) =>
                setButtonUrl(event.target.value)
              }
              className="
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
                focus:border-white/20
                focus:bg-white/[0.05]
              "
              placeholder="/shop"
            />
          </div>

        </div>

        {/* ACTIONS */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={handlePreview}
            disabled={saving}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-white/10
              px-5
              py-3
              text-sm
              text-white/60
              transition
              hover:bg-white/5
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Eye size={17} />
            Preview
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              flex
              items-center
              justify-center
              gap-2
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
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                {saved ? "Saved" : "Save Changes"}
              </>
            )}
          </button>

        </div>
      </div>

      {/* INFORMATION */}

      <div className="flex gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-5">
        <Mail
          size={18}
          className="mt-0.5 shrink-0 text-white/30"
        />

        <div>
          <p className="text-sm text-white/60">
            Welcome email
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            These settings are saved to your home settings
            and can be used by the backend when sending
            welcome emails to new newsletter subscribers.
          </p>
        </div>
      </div>

    </section>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
