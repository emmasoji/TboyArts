import {
  AlertTriangle,
  FileQuestion,
  ImageOff,
  RefreshCw,
  ServerCrash,
  WifiOff,
  Wrench,
  Home,
  ArrowLeft,
} from "lucide-react";

export type ErrorStateType =
  | "network"
  | "not-found"
  | "server"
  | "general"
  | "image"
  | "maintenance";

type ErrorStateProps = {
  type?: ErrorStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  fullPage?: boolean;
};

const ERROR_CONFIG: Record<
  ErrorStateType,
  {
    icon: typeof WifiOff;
    title: string;
    message: string;
  }
> = {
  network: {
    icon: WifiOff,
    title: "Connection Problem",
    message:
      "We couldn't connect to the server. Please check your internet connection and try again.",
  },
  "not-found": {
    icon: FileQuestion,
    title: "Page Not Found",
    message:
      "The page you're looking for doesn't exist or may have been moved.",
  },
  server: {
    icon: ServerCrash,
    title: "Server Problem",
    message:
      "Something went wrong on our side. Please try again in a moment.",
  },
  general: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    message:
      "An unexpected error occurred. Please try again.",
  },
  image: {
    icon: ImageOff,
    title: "Image Unavailable",
    message:
      "This artwork image couldn't be loaded.",
  },
  maintenance: {
    icon: Wrench,
    title: "Temporarily Unavailable",
    message:
      "This part of TboyArts is temporarily unavailable. Please try again later.",
  },
};

export default function ErrorState({
  type = "general",
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  fullPage = false,
}: ErrorStateProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;

  const defaultAction =
    type === "not-found" ? "Go Home" : "Try Again";

  const action =
    actionLabel || defaultAction;

  const handleDefaultAction = () => {
    if (onAction) {
      onAction();
      return;
    }

    if (type === "not-found") {
      window.location.href = "/";
      return;
    }

    window.location.reload();
  };

  return (
    <div
      className={[
        "flex w-full items-center justify-center px-4 py-12 text-[var(--text-primary)]",
        fullPage ? "min-h-screen" : "min-h-[320px]",
      ].join(" ")}
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <Icon
            size={36}
            strokeWidth={1.5}
            className="text-[var(--text-primary)] opacity-80"
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title || config.title}
        </h1>

        <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)] md:text-base">
          {message || config.message}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDefaultAction}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--text-primary)] px-5 py-3 text-sm font-medium text-[var(--bg-primary)] transition hover:opacity-85"
          >
            {type === "not-found" ? (
              <Home size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
            {action}
          </button>

          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-3 text-sm font-medium transition hover:bg-[var(--text-primary)]/[0.06]"
            >
              <ArrowLeft size={16} />
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
