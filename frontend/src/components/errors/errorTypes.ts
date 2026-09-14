export type ErrorType =
  | "network"
  | "not-found"
  | "server"
  | "general"
  | "image"
  | "maintenance";

export type ErrorAction = "retry" | "refresh" | "home" | "shop" | "back";

export const ERROR_CONFIG: Record<
  ErrorType,
  {
    title: string;
    message: string;
    action: ErrorAction;
  }
> = {
  network: {
    title: "Connection problem",
    message:
      "We couldn't connect to TboyArts. Please check your internet connection and try again.",
    action: "retry",
  },

  "not-found": {
    title: "Page not found",
    message:
      "The page you're looking for doesn't exist or may have been moved.",
    action: "home",
  },

  server: {
    title: "Server problem",
    message:
      "Something went wrong on our side. Please try again in a moment.",
    action: "retry",
  },

  general: {
    title: "Something went wrong",
    message:
      "An unexpected error occurred. Please try again or return to the previous page.",
    action: "retry",
  },

  image: {
    title: "Image unavailable",
    message:
      "This artwork image couldn't be loaded. Please try again.",
    action: "retry",
  },

  maintenance: {
    title: "Temporarily unavailable",
    message:
      "This part of TboyArts is temporarily unavailable. Please try again later.",
    action: "refresh",
  },
};
