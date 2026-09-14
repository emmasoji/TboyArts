import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Eye,
  Save,
  Send,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { getActiveNewsletterSubscriberCount } from "../../../../services/newsletterService";
import { supabase } from "../../../../lib/supabase";

interface NewsletterImage {
  src: string;
  alt: string;
}

export default function UpdateNewsletter() {
  const [fileName, setFileName] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [preview, setPreview] = useState("");
  const [images, setImages] = useState<NewsletterImage[]>([]);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [showSendConfirmation, setShowSendConfirmation] =
    useState(false);

  const [activeSubscriberCount, setActiveSubscriberCount] =
    useState<number | null>(null);

  const [loadingSubscriberCount, setLoadingSubscriberCount] =
    useState(false);

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!markdown) {
      setPreview("");
      setImages([]);
      return;
    }

    setPreview(markdownToHtml(markdown));
    setImages(extractImages(markdown));
  }, [markdown]);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSaved(false);
    setSent(false);
    setSendResult(null);

    const isMarkdown =
      file.name.toLowerCase().endsWith(".md") ||
      file.name.toLowerCase().endsWith(".markdown");

    if (!isMarkdown) {
      setError("Please select a Markdown (.md) file.");
      event.target.value = "";
      return;
    }

    try {
      const content = await file.text();

      setFileName(file.name);
      setMarkdown(content);
      setShowPreview(true);
    } catch (err) {
      console.error("Failed to read newsletter file:", err);
      setError("Failed to read the newsletter file.");
    }

    event.target.value = "";
  }

  function removeFile() {
    setFileName("");
    setMarkdown("");
    setPreview("");
    setImages([]);
    setSaved(false);
    setSent(false);
    setSendResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    if (!markdown.trim()) {
      setError("Upload a newsletter Markdown file before saving.");
      return;
    }

    localStorage.setItem(
      "tboyarts_update_newsletter",
      JSON.stringify({
        fileName,
        markdown,
        savedAt: new Date().toISOString(),
      }),
    );

    setSaved(true);
    setSent(false);
    setSendResult(null);
    setError("");
  }

  async function handleSend() {
    if (!markdown.trim()) {
      setError("Upload a newsletter Markdown file first.");
      return;
    }

    if (!saved) {
      setError("Save the newsletter before sending it.");
      return;
    }

    try {
      setLoadingSubscriberCount(true);
      setError("");

      const count =
        await getActiveNewsletterSubscriberCount();

      setActiveSubscriberCount(count);
      setShowSendConfirmation(true);
    } catch (err) {
      console.error(
        "Failed to get active subscriber count:",
        err,
      );

      setError(
        "Unable to get the number of active subscribers.",
      );
    } finally {
      setLoadingSubscriberCount(false);
    }
  }

  async function handleConfirmedSend() {
    if (!markdown.trim()) {
      setError("Upload a newsletter Markdown file first.");
      setShowSendConfirmation(false);
      return;
    }

    if (!saved) {
      setError("Save the newsletter before sending it.");
      setShowSendConfirmation(false);
      return;
    }

    try {
      setSending(true);
      setError("");
      setSent(false);
      setSendResult(null);

      const apiBaseUrl =
        import.meta.env.VITE_API_URL ||
        "http://localhost:8000";

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Your admin session has expired. Please sign in again.",
        );
      }

      const response = await fetch(
        `${apiBaseUrl}/api/newsletter/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            subject:
              fileName.replace(/\\.(md|markdown)$/i, "") ||
              "TboyArts Newsletter",
            html: preview,
          }),
        },
      );

      let data: {
        success?: boolean;
        sent?: number;
        failed?: number;
        total?: number;
        message?: string;
        detail?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Newsletter server returned HTTP ${response.status}.`,
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail ||
            data.message ||
            "The newsletter could not be sent.",
        );
      }

      const result = {
        sent: data.sent ?? 0,
        failed: data.failed ?? 0,
        total: data.total ?? 0,
      };

      setSendResult(result);
      setSent(true);
      setShowSendConfirmation(false);

      if (result.failed > 0) {
        setError(
          `${result.sent} newsletter(s) sent successfully, but ${result.failed} failed.`,
        );
      }
    } catch (err) {
      console.error(
        "Failed to send newsletter:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send newsletter.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <article className="space-y-6">

      {/* HEADER */}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
          Newsletter
        </p>

        <h3 className="mt-1 text-xl font-medium">
          Update Newsletter
        </h3>

        <p className="mt-1 text-sm leading-6 text-white/40">
          Upload a prepared Markdown newsletter. The contents of
          the file will be converted into the email sent to
          subscribers.
        </p>
      </div>

      {/* UPLOAD CARD */}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          onChange={handleFileChange}
          className="hidden"
        />

        {!fileName ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="
              flex
              min-h-52
              w-full
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-white/10
              bg-white/[0.015]
              px-6
              text-center
              transition
              hover:border-white/20
              hover:bg-white/[0.03]
            "
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/50">
              <Upload size={21} />
            </span>

            <span className="text-sm font-medium text-white/70">
              Upload newsletter
            </span>

            <span className="mt-2 text-xs text-white/30">
              Select a Markdown (.md) file
            </span>
          </button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <FileText size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  {fileName}
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Markdown newsletter loaded
                </p>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-white/5
                  text-white/40
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                aria-label="Remove newsletter file"
              >
                <X size={17} />
              </button>

            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {sent && sendResult && (
          <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
            <p className="text-sm font-medium text-green-400">
              Newsletter sent successfully.
            </p>

            <p className="mt-1 text-xs leading-5 text-green-400/70">
              {sendResult.sent} of {sendResult.total} active subscribers received the newsletter.
              {sendResult.failed > 0 &&
                ` ${sendResult.failed} delivery attempt${sendResult.failed === 1 ? "" : "s"} failed.`}
            </p>
          </div>
        )}

      </div>

      {/* FILE CONTENT */}

      {markdown && (
        <div className="grid gap-6 xl:grid-cols-2">

          {/* MARKDOWN SOURCE */}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <p className="text-xs uppercase tracking-wider text-white/30">
                  Source
                </p>

                <p className="mt-1 text-sm text-white/60">
                  Markdown content
                </p>
              </div>

              <FileText
                size={18}
                className="text-white/30"
              />

            </div>

            <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-xs leading-6 text-white/50">
              {markdown}
            </pre>

          </div>

          {/* PREVIEW */}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <p className="text-xs uppercase tracking-wider text-white/30">
                  Preview
                </p>

                <p className="mt-1 text-sm text-white/60">
                  Email content
                </p>
              </div>

              <Eye
                size={18}
                className="text-white/30"
              />

            </div>

            <div
              className="prose prose-invert max-w-none overflow-auto p-5 text-sm leading-7"
              dangerouslySetInnerHTML={{
                __html: preview,
              }}
            />

          </div>

        </div>
      )}

      {/* IMAGES */}

      {images.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

          <div className="mb-4 flex items-center gap-3">

            <ImageIcon
              size={18}
              className="text-white/30"
            />

            <div>
              <p className="text-sm text-white/60">
                Newsletter Images
              </p>

              <p className="mt-1 text-xs text-white/30">
                Images detected in the Markdown file.
              </p>
            </div>

          </div>

          <div className="space-y-2">

            {images.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <p className="truncate text-xs text-white/50">
                  {image.alt || "Newsletter image"}
                </p>

                <p className="mt-1 truncate text-[11px] text-white/25">
                  {image.src}
                </p>
              </div>
            ))}

          </div>

        </div>
      )}

      {/* ACTIONS */}

      {markdown && (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">

          <div>
            <p className="text-sm text-white/60">
              Newsletter actions
            </p>

            <p className="mt-1 text-xs leading-5 text-white/30">
              Preview the newsletter, save it, then send it to
              your active subscribers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

            {/* PREVIEW */}

            <button
              type="button"
              onClick={() => setShowPreview(true)}
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
              "
            >
              <Eye size={16} />
              Preview
            </button>

            {/* SAVE */}

            <button
              type="button"
              onClick={handleSave}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                px-5
                py-3
                text-sm
                font-medium
                text-white
                transition
                hover:bg-white/10
              "
            >
              <Save size={16} />

              {saved
                ? "Saved"
                : "Save Newsletter"}
            </button>

            {/* SEND */}

            <button
              type="button"
              onClick={handleSend}
              disabled={
                sending ||
                loadingSubscriberCount ||
                !saved
              }
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
                disabled:opacity-40
              "
            >
              <Send size={16} />

              {loadingSubscriberCount
                ? "Checking subscribers..."
                : sent
                  ? "Sent"
                  : "Send Newsletter"}
            </button>

          </div>

        </div>
      )}

      {/* SEND CONFIRMATION */}

      {showSendConfirmation && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#111113] shadow-2xl sm:max-w-lg sm:rounded-3xl">

            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                    Confirm Send
                  </p>

                  <h3 className="mt-2 text-xl font-medium text-white">
                    Send this newsletter?
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSendConfirmation(false)}
                  disabled={sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Close confirmation"
                >
                  <X size={18} />
                </button>

              </div>
            </div>

            <div className="space-y-5 px-6 py-6">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                <p className="text-sm leading-6 text-white/60">
                  You are about to send this newsletter to every
                  currently active newsletter subscriber.
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">

                  <span className="text-sm text-white/40">
                    Active subscribers
                  </span>

                  <span className="text-2xl font-semibold text-white">
                    {activeSubscriberCount ?? 0}
                  </span>

                </div>

              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.015] px-4 py-3">
                <p className="text-xs text-white/30">
                  Newsletter file
                </p>

                <p className="mt-1 truncate text-sm text-white/60">
                  {fileName}
                </p>
              </div>

              <p className="text-xs leading-5 text-white/30">
                Please confirm that you want to email all active
                subscribers. This action should only be confirmed
                when the newsletter is ready to send.
              </p>

            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => setShowSendConfirmation(false)}
                disabled={sending}
                className="
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
                  disabled:opacity-40
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmedSend}
                disabled={sending || activeSubscriberCount === 0}
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
                  disabled:opacity-40
                "
              >
                <Send size={16} />

                {sending
                  ? "Sending..."
                  : "Confirm & Send"}
              </button>

            </div>

          </div>
        </div>
      )}

      {/* FULL PREVIEW */}

      {showPreview && markdown && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">

          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#111113] shadow-2xl sm:max-w-3xl sm:rounded-3xl">

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <p className="text-xs uppercase tracking-wider text-white/30">
                  Newsletter Preview
                </p>

                <p className="mt-1 text-sm text-white/60">
                  {fileName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>

            </div>

            <div
              className="prose prose-invert max-w-none overflow-auto bg-white/[0.02] p-6 text-sm leading-7 sm:p-8"
              dangerouslySetInnerHTML={{
                __html: preview,
              }}
            />

          </div>

        </div>
      )}

    </article>
  );
}

function markdownToHtml(markdown: string): string {
  let html = escapeHtml(markdown);

  html = html.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    '<img src="$2" alt="$1" title="$3" class="my-6 w-full rounded-2xl object-cover" />',
  );

  html = html.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    '<a href="$2" class="font-medium underline underline-offset-4">$1</a>',
  );

  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="mt-6 mb-3 text-lg font-medium text-white">$1</h3>',
  );

  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="mt-7 mb-3 text-xl font-medium text-white">$1</h2>',
  );

  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="mb-5 text-3xl font-semibold text-white">$1</h1>',
  );

  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong>$1</strong>",
  );

  html = html.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g,
    "<em>$1</em>",
  );

  html = html.replace(
    /^---$/gm,
    '<hr class="my-6 border-white/10" />',
  );

  html = html.replace(
    /^(?:- .+(?:\n|$))+?/gm,
    (block) => {
      const items = block
        .trim()
        .split("\n")
        .map(
          (line) =>
            `<li>${line.replace(/^- /, "")}</li>`,
        )
        .join("");

      return `<ul class="my-4 list-disc space-y-2 pl-6">${items}</ul>`;
    },
  );

  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();

      if (!trimmed) return "";

      if (
        trimmed.startsWith("<h1") ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<hr") ||
        trimmed.startsWith("<img")
      ) {
        return trimmed;
      }

      return `<p class="my-4 text-white/70">${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

function extractImages(markdown: string): NewsletterImage[] {
  const images: NewsletterImage[] = [];

  const regex =
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || "",
      src: match[2],
    });
  }

  return images;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
