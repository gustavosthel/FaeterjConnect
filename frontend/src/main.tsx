import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // seu arquivo já existente
import { ThemeProvider } from "./theme/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
