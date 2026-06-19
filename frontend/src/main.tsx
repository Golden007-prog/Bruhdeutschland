import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { applyTheme } from "@/lib/theme/theme";
import "katex/dist/katex.min.css";
import "./index.css";

// Apply the persisted/system theme before first paint to avoid a flash.
applyTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
