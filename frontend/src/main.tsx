import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import AnalyticsTracker from "./components/analytics/AnalyticsTracker";
import ErrorBoundary from "./components/errors/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { TrackOrderProvider } from "./contexts/TrackOrderContext";
import "./index.css";
import "./styles/tracking.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsTracker />
      <ThemeProvider>
        <CurrencyProvider>
        <TrackOrderProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </TrackOrderProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
