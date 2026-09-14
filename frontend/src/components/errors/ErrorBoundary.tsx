import React from "react";
import ErrorState from "./ErrorState";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<
  Props,
  State
> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("TboyArts application error:", error);
    console.error("Component error information:", errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message?.toLowerCase() || "";

      const isChunkError =
        errorMessage.includes("chunk") ||
        errorMessage.includes("loading css chunk") ||
        errorMessage.includes("dynamically imported module") ||
        errorMessage.includes("failed to fetch dynamically imported module");

      return (
        <ErrorState
          type={isChunkError ? "general" : "general"}
          title={
            isChunkError
              ? "This Page Needs to Refresh"
              : "Something Went Wrong"
          }
          message={
            isChunkError
              ? "A newer version of TboyArts may be available. Please refresh the page to continue."
              : "An unexpected error occurred while loading this part of TboyArts."
          }
          actionLabel="Refresh Page"
          onAction={this.handleRefresh}
          fullPage
        />
      );
    }

    return this.props.children;
  }
}
