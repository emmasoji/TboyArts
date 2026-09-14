import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";
import { useAdminTheme } from "../../../contexts/AdminThemeContext";
import ErrorState from "../../errors/ErrorState";

type StorageData = {
  bucket: string;
  fileCount: number;
  usedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercentage: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(2)} ${units[index]}`;
}

export default function Storage() {
  const { theme } = useAdminTheme();
  const isLight = theme === "light";

  const [storage, setStorage] = useState<StorageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStorage() {
    try {
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/storage/usage`,
      );

      if (!response.ok) {
        throw new Error("Failed to load storage usage");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || "Failed to load storage usage.",
        );
      }

      setStorage({
        bucket: data.bucket,
        fileCount: data.fileCount,
        usedBytes: data.usedBytes,
        limitBytes: data.limitBytes,
        availableBytes: data.availableBytes,
        usagePercentage: data.usagePercentage,
      });
    } catch (error) {
      console.error("Storage usage error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load storage usage.",
      );
    }
  }

  useEffect(() => {
    void loadStorage();
  }, []);

  if (error) {
    return (
      <ErrorState
        type="server"
        title="Unable to Load Storage"
        message={
          error ||
          "We couldn't load the storage information right now. Please try again."
        }
        actionLabel="Try Again"
        onAction={() => {
          void loadStorage();
        }}
      />
    );
  }

  const percentage = storage?.usagePercentage ?? 0;
  const used = storage ? formatBytes(storage.usedBytes) : "0 B";
  const limit = storage ? formatBytes(storage.limitBytes) : "0 B";

  const surface = isLight
    ? "bg-[var(--admin-surface)] border-[var(--admin-border)]"
    : "bg-[var(--admin-surface)] border-[var(--admin-border)]";

  const iconSurface = isLight
    ? "bg-[var(--admin-surface-soft)]"
    : "bg-[var(--admin-surface-soft)]";

  const muted = "text-[var(--admin-text-muted)]";
  const faint = "text-[var(--admin-text-faint)]";

  return (
    <article
      className={[
        "rounded-2xl border p-6",
        "transition-colors duration-300",
        surface,
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.2em]",
              muted,
            ].join(" ")}
          >
            Storage
          </p>

          <h3
            className={[
              "mt-3 text-3xl font-semibold",
              "text-[var(--admin-text)]",
            ].join(" ")}
          >
            {storage ? (
              used
            ) : (
              <span className="block h-9 w-32 animate-pulse rounded-lg bg-[var(--admin-surface-muted)]" />
            )}
          </h3>
        </div>

        <div
          className={[
            "rounded-xl p-3",
            iconSurface,
            "transition-colors duration-300",
          ].join(" ")}
        >
          <HardDrive
            size={20}
            className="text-[var(--admin-text)]"
          />
        </div>
      </div>

      <div className="mt-10">
        <div
          className={[
            "mb-3 flex justify-between text-xs",
            muted,
          ].join(" ")}
        >
          <span>
            {storage ? (
              `${used} used`
            ) : (
              <span className="inline-block h-3 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            )}
          </span>

          <span>
            {storage ? (
              `${limit} available`
            ) : (
              <span className="inline-block h-3 w-24 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
            )}
          </span>
        </div>

        <div
          className={[
            "h-3 overflow-hidden rounded-full",
            "bg-[var(--admin-surface-soft)]",
            "transition-colors duration-300",
          ].join(" ")}
        >
          <div
            className={[
              "h-full rounded-full",
              "bg-[var(--admin-text)]",
              "transition-all duration-700",
            ].join(" ")}
            style={{
              width: `${Math.min(Math.max(percentage, 0), 100)}%`,
            }}
          />
        </div>
      </div>

      <div
        className={[
          "mt-5 flex items-center justify-between text-sm",
          faint,
        ].join(" ")}
      >
        <span>
          {storage ? (
            `${storage.fileCount} files`
          ) : (
            <span className="inline-block h-4 w-16 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          )}
        </span>

        <span>
          {storage ? (
            storage.bucket
          ) : (
            <span className="inline-block h-4 w-20 animate-pulse rounded bg-[var(--admin-surface-muted)]" />
          )}
        </span>
      </div>
    </article>
  );
}
