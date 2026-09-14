import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import ErrorBoundary from "./components/errors/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TrackOrderProvider } from "./contexts/TrackOrderContext";
import "./index.css";
import "./styles/tracking.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TrackOrderProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </TrackOrderProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);