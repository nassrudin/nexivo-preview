import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "./styles.css";
import "./studio.css";
import "./public/public.css";
import "./layouts/workspace.css";
import "./typography.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
